function calculateBalances(expenses, settlements, members) {
  const balances = {};
  members.forEach((m) => { balances[m._id.toString()] = 0; });

  for (const expense of expenses) {
    const payer = expense.paidBy._id?.toString() || expense.paidBy.toString();
    if (balances[payer] !== undefined) balances[payer] += expense.amount;

    for (const split of expense.splits) {
      const uid = split.user._id?.toString() || split.user.toString();
      if (balances[uid] !== undefined) balances[uid] -= split.amount;
    }
  }

  for (const s of settlements) {
    const from = s.from._id?.toString() || s.from.toString();
    const to = s.to._id?.toString() || s.to.toString();
    if (balances[from] !== undefined) balances[from] -= s.amount;
    if (balances[to] !== undefined) balances[to] += s.amount;
  }

  return balances;
}

module.exports = calculateBalances;
