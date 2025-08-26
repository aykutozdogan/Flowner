import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Receipt, DollarSign, FileText, User, AlertTriangle, CheckCircle } from 'lucide-react';

interface ExpenseApprovalFormProps {
  onSuccess?: () => void;
}

export function ExpenseApprovalForm({ onSuccess }: ExpenseApprovalFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startExpenseMutation = useMutation({
    mutationFn: ({ amount, description, category }: { amount: number; description: string; category: string }) =>
      api.startExpenseApproval(amount, description, category),
    onSuccess: (data) => {
      toast({
        title: "Masraf Onayı Başlatıldı",
        description: `Masraf talebi başarıyla gönderildi. ${data.data.approverRole === 'tenant_admin' ? 'Yönetici onayına' : 'Onaylayıcı onayına'} gönderildi.`,
      });
      
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('General');
      
      // Refresh relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/v1/processes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/tasks/inbox'] });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Masraf Talebi Başarısız",
        description: error.message || "Masraf talebi gönderilirken bir hata oluştu.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description) {
      toast({
        variant: "destructive",
        title: "Eksik Bilgi",
        description: "Tutar ve açıklama zorunlu alanlarıdır.",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Geçersiz Tutar",
        description: "Lütfen geçerli bir tutar girin.",
      });
      return;
    }

    startExpenseMutation.mutate({
      amount: numAmount,
      description,
      category,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="expense-approval-form">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          S7 Demo: Masraf Onayı
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Tutar (TL)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              data-testid="input-expense-amount"
              className="text-right"
            />
            {amount && parseFloat(amount) > 5000 && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span>5000 TL üzeri - Yönetici onayı gerekli</span>
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Admin Onayı
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Kategori
            </Label>
            <Select value={category} onValueChange={setCategory} data-testid="select-expense-category">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">Genel</SelectItem>
                <SelectItem value="Travel">Seyahat</SelectItem>
                <SelectItem value="Office">Ofis</SelectItem>
                <SelectItem value="Marketing">Pazarlama</SelectItem>
                <SelectItem value="IT">Bilgi İşlem</SelectItem>
                <SelectItem value="Training">Eğitim</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Açıklama
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masraf açıklaması..."
              rows={3}
              data-testid="textarea-expense-description"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={startExpenseMutation.isPending}
            data-testid="button-submit-expense"
          >
            {startExpenseMutation.isPending ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Masraf Talebini Gönder
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span>5000 TL altı: Onaylayıcı onayı</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              <span>5000 TL üzeri: Yönetici onayı</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}