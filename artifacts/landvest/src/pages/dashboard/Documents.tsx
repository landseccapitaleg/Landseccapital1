import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Documents() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Document Library</h1>
        <p className="text-muted-foreground mt-1">
          Your statements, certificates, tax documents, and legal agreements will appear here when issued to your account.
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="py-16 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-semibold">No documents available</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Documents are added to your account after an investment statement, certificate, or other account document is generated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}