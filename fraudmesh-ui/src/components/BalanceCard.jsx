import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import soundService from '../services/audio';

const BalanceCard = ({ accountId = 'ACC00001' }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const data = await apiService.getBalance(accountId);
        setBalance(data.balance);
      } catch (e) {
        console.error('Error fetching balance', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [accountId]);

  return (
    <div className="p-4 glass bg-slate-900/70 border border-slate-800 rounded-xl text-white mb-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">Account Balance</h3>
      {loading ? (
        <span className="text-sm text-slate-400">Loading…</span>
      ) : (
        <p className="text-2xl font-bold text-emerald-400">${balance?.toLocaleString()}</p>
      )}
    </div>
  );
};

export default BalanceCard;
