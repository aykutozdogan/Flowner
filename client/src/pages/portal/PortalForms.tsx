import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Eye } from 'lucide-react';

interface Form {
  id: string;
  key: string;
  name: string;
  description?: string;
  version: number;
  status: 'published';
  fields: any[];
  created_at: string;
  updated_at: string;
}

export default function PortalForms() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: forms, isLoading } = useQuery<Form[]>({
    queryKey: ['/api/v1/forms', { status: 'published' }],
    select: (data: any) => data.data || [],
  });

  const filteredForms = forms?.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.key.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleViewForm = (form: Form) => {
    // This would open a form viewer/filler
    console.log('View form:', form);
  };

  const getFieldTypeStats = (fields: any[]) => {
    const types = fields.reduce((acc, field) => {
      acc[field.type] = (acc[field.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(types)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Available Forms</h1>
          <p className="text-gray-600 mt-2">Browse and access published forms for data entry</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forms?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Updated</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {forms?.filter(f => {
                  const daysSince = (Date.now() - new Date(f.updated_at).getTime()) / (1000 * 60 * 60 * 24);
                  return daysSince <= 7;
                }).length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Fields</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {forms?.length ? Math.round(forms.reduce((acc, f) => acc + f.fields.length, 0) / forms.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forms Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading forms...</div>
        ) : filteredForms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms available</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No forms match your search criteria.' : 'No published forms are available.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((form) => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <Badge variant="outline">v{form.version}</Badge>
                  </div>
                  <CardTitle className="text-lg">{form.name}</CardTitle>
                  {form.description && (
                    <p className="text-sm text-gray-600">{form.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Key:</span> {form.key}
                      </div>
                      <div>
                        <span className="font-medium">Fields:</span> {form.fields.length}
                      </div>
                      {form.fields.length > 0 && (
                        <div>
                          <span className="font-medium">Types:</span> {getFieldTypeStats(form.fields)}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Updated:</span> {new Date(form.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleViewForm(form)}
                      className="w-full"
                      variant="outline"
                      data-testid={`view-form-${form.key}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Form
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}