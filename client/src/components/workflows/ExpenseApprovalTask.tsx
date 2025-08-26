import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, MessageSquare, Receipt, Calendar, User } from 'lucide-react';

interface ExpenseApprovalTaskProps {
  task: {
    id: string;
    name: string;
    process_id: string;
    form_data: {
      amount: number;
      description: string;
      category: string;
      requestedBy: string;
    };
    created_at: string;
  };
  onComplete?: () => void;
}

export function ExpenseApprovalTask({ task, onComplete }: ExpenseApprovalTaskProps) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [comments, setComments] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeExpenseMutation = useMutation({
    mutationFn: ({ decision, comments }: { decision: 'approved' | 'rejected'; comments: string }) =>
      api.completeExpenseApproval(task.process_id, task.id, decision, comments),
    onSuccess: (data) => {
      toast({
        title: `Masraf ${decision === 'approved' ? 'Onaylandı' : 'Reddedildi'}`,
        description: `Masraf talebi başarıyla ${decision === 'approved' ? 'onaylandı' : 'reddedildi'}.`,
      });
      
      // Refresh relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/v1/tasks/inbox'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/processes'] });
      
      onComplete?.();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "İşlem Başarısız",
        description: error.message || "Masraf onayı işlenirken bir hata oluştu.",
      });
    },
  });

  const handleDecision = (selectedDecision: 'approved' | 'rejected') => {
    if (!selectedDecision) return;
    
    setDecision(selectedDecision);
    
    completeExpenseMutation.mutate({
      decision: selectedDecision,
      comments,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  return (
    <Card className="w-full max-w-lg mx-auto" data-testid="expense-approval-task">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Masraf Onayı Bekliyor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Expense Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Tutar</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(task.form_data.amount)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Kategori</span>
              <Badge variant="secondary">{task.form_data.category}</Badge>
            </div>
            
            <div>
              <span className="text-sm font-medium text-muted-foreground">Açıklama</span>
              <p className="text-sm mt-1 text-foreground">{task.form_data.description}</p>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Talep Eden: {task.form_data.requestedBy}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Onay Yorumu (Opsiyonel)
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Onay/Red gerekçesi..."
              rows={3}
              data-testid="textarea-approval-comments"
            />
          </div>

          {/* Decision Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => handleDecision('approved')}
              disabled={completeExpenseMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-approve-expense"
            >
              {completeExpenseMutation.isPending && decision === 'approved' ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Onaylanıyor...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Onayla
                </>
              )}
            </Button>
            
            <Button
              onClick={() => handleDecision('rejected')}
              disabled={completeExpenseMutation.isPending}
              variant="destructive"
              className="flex-1"
              data-testid="button-reject-expense"
            >
              {completeExpenseMutation.isPending && decision === 'rejected' ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Reddediliyor...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reddet
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>⚡ S7 Demo: Bu masraf onayı workflow engine ile otomatik yönetilmektedir.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}