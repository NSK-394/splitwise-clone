function simplifyDebts(balanceMap) {
  const entries = Object.entries(balanceMap).map(([userId, amount]) => ({ userId, amount }));

  const creditors = entries.filter((e) => e.amount > 0.005).sort((a, b) => b.amount - a.amount);
  const debtors = entries.filter((e) => e.amount < -0.005).sort((a, b) => a.amount - b.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settled = Math.min(-debtor.amount, creditor.amount);

    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Math.round(settled * 100) / 100,
    });

    debtor.amount += settled;
    creditor.amount -= settled;

    if (Math.abs(debtor.amount) < 0.005) i++;
    if (Math.abs(creditor.amount) < 0.005) j++;
  }

  return transactions;
}

module.exports = simplifyDebts;
