export const getBillsAndLoansAsSpending = (bills) => {
  if (!bills || !Array.isArray(bills)) return [];
  return bills.map((item) => ({
    id: item.id,
    description: item.name,
    category: item.type === "bill" ? "Bill" : "Loan",
    amount: parseFloat(item.amount) || 0,
    date: item.due_date || new Date().toISOString().split("T")[0],
    status: item.status || "unpaid",
    originalType: item.type,
  }));
};
