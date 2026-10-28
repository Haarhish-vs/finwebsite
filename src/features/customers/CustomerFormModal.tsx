import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { customerApi } from '../../api/customers';
import type { Customer } from '../../api/types';
import { User, Phone, Mail, Home, FileText, AlertCircle } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customer,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [initialAmount, setInitialAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFullName(customer.full_name || customer.name || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setAddress(customer.address || '');
      setInitialAmount(String(customer.initial_amount_collected || 0));
      setNotes(customer.notes || '');
      setStatus(customer.status || 'active');
    } else {
      setFullName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setInitialAmount('0');
      setNotes('');
      setStatus('active');
    }
    setError(null);
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Customer name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (customer) {
        // Update
        await customerApi.updateCustomer(customer.id, {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          initial_amount_collected: parseFloat(initialAmount) || 0,
          notes: notes.trim(),
          status,
        });
      } else {
        // Create
        await customerApi.createCustomer({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          initial_amount_collected: parseFloat(initialAmount) || 0,
          notes: notes.trim(),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer Profile' : 'Add New Customer'}
      subtitle={customer ? `ID: ${customer.id}` : 'Create a borrower profile without originating a loan'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <Input
          label="Full Name *"
          placeholder="e.g. Ramesh Kumar"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          prefixIcon={<User className="h-4 w-4" />}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Phone Number"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            prefixIcon={<Phone className="h-4 w-4" />}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="ramesh@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            prefixIcon={<Mail className="h-4 w-4" />}
          />
        </div>

        <Input
          label="Residential Address"
          placeholder="Street address, locality, city"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          prefixIcon={<Home className="h-4 w-4" />}
        />

        {!customer && (
          <Input
            label="Initial Deposit / Collected (₹)"
            type="number"
            placeholder="0"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
            prefixIcon={<span className="font-bold text-xs">₹</span>}
            helperText="Initial advance or security deposit received from customer"
          />
        )}

        {customer && (
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full rounded-lg border border-[#CBD5E1] text-sm py-2 px-3 text-[#0F172A] bg-white focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}

        <Input
          label="Notes / Comments"
          placeholder="e.g. Referred by member, documents submitted..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          prefixIcon={<FileText className="h-4 w-4" />}
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {customer ? 'Update Profile' : 'Save Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
