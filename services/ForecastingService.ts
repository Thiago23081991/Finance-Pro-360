import { Transaction, ForecastItem } from '../types';

export class ForecastingService {
    /**
     * Generates a forecast of future transactions based on known recurring expenses
     * and historical patterns.
     */
    static generateForecast(
        transactions: Transaction[],
        currentBalance: number,
        monthsToProject: number = 3
    ): { forecast: ForecastItem[], projectedBalance: { date: string, balance: number }[] } {

        const forecast: ForecastItem[] = [];
        const today = new Date();
        const projectedBalances: { date: string, balance: number }[] = [];

        // 1. Identify "Ghost" Recurring Expenses (Simple Heuristic for beta)
        // Groups transactions by description and checks if they happen monthly
        const recurringCandidates = this.detectRecurringPatterns(transactions);

        // 2. Project future occurrences
        for (let i = 0; i < monthsToProject; i++) {
            const targetMonth = new Date(today.getFullYear(), today.getMonth() + 1 + i, 1);

            recurringCandidates.forEach(cand => {
                // Ensure we don't duplicate if already manually added for that month
                // (Optimistic check omitted for simplicity in MVP)

                // Create the predicted item
                // Use the same day of month as the last occurrence
                const lastDate = new Date(cand.lastOccurrence);
                const predictedDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), lastDate.getDate());

                forecast.push({
                    date: predictedDate.toISOString().split('T')[0],
                    amount: cand.avgAmount,
                    description: cand.description,
                    type: 'expense', // Mostly safe assumption for recurring bills
                    status: 'predicted',
                    category: cand.category
                });
            });
        }

        // 3. Add ALREADY CONFIRMED future transactions from the database
        const confirmendFuture = transactions
            .filter(t => new Date(t.date) > today)
            .map(t => ({
                date: t.date,
                amount: t.amount,
                description: t.description,
                type: t.type,
                status: 'confirmed' as const,
                category: t.category
            }));

        // Merge and Sort
        const allItems = [...forecast, ...confirmendFuture].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // 4. Calculate Running Balance
        let runningBalance = currentBalance;
        // Generate daily balance points for the chart
        // (Simplified: just one point per predicted item date)
        allItems.forEach(item => {
            if (item.type === 'income') {
                runningBalance += item.amount;
            } else {
                runningBalance -= item.amount;
            }
            projectedBalances.push({ date: item.date, balance: runningBalance });
        });

        return { forecast: allItems, projectedBalance: projectedBalances };
    }

    private static detectRecurringPatterns(transactions: Transaction[]) {
        // Group by normalized description (e.g., "Netflix" -> "netflix")
        const groups: Record<string, Transaction[]> = {};

        // Look at last 6 months only
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        transactions
            .filter(t => new Date(t.date) > sevenMonthsAgo && t.type === 'expense')
            .forEach(t => {
                const key = t.description.trim().toLowerCase();
                if (!groups[key]) groups[key] = [];
                groups[key].push(t);
            });

        const patterns = [];

        for (const desc in groups) {
            const group = groups[desc];
            if (group.length >= 2) { // If it happened at least twice in 6 months
                // Calculate average amount
                const avgAmount = group.reduce((sum, t) => sum + t.amount, 0) / group.length;

                // Check consistency (optional, but good for MVP)
                patterns.push({
                    description: group[0].description, // Use original casing
                    category: group[0].category,
                    avgAmount,
                    lastOccurrence: group.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
                });
            }
        }
        return patterns;
    }
}

// Temporary fix for date calculation variable name
const sevenMonthsAgo = new Date();
sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);
