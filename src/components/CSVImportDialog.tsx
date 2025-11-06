import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  onImportSuccess: (cards: any[]) => void;
}

interface CSVRow {
  title: string;
  description?: string;
  priority?: 'baixa' | 'moderada' | 'alta';
  dueDate?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function CSVImportDialog({ open, onOpenChange, columnId, onImportSuccess }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validRows, setValidRows] = useState<CSVRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      parseCSV(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const validateRow = (row: any, index: number): { valid: boolean; errors: ValidationError[] } => {
    const errors: ValidationError[] = [];

    // Validar título (obrigatório)
    if (!row.titulo || row.titulo.trim() === '') {
      errors.push({
        row: index + 2, // +2 porque começa em 1 e tem header
        field: 'titulo',
        message: 'Título é obrigatório'
      });
    }

    // Validar prioridade (opcional, mas deve ser válida se preenchida)
    if (row.prioridade && !['baixa', 'moderada', 'alta'].includes(row.prioridade.toLowerCase())) {
      errors.push({
        row: index + 2,
        field: 'prioridade',
        message: 'Prioridade deve ser: baixa, moderada ou alta'
      });
    }

    // Validar data (opcional, mas deve ser válida se preenchida)
    if (row.data_vencimento && row.data_vencimento.trim() !== '') {
      const date = new Date(row.data_vencimento);
      if (isNaN(date.getTime())) {
        errors.push({
          row: index + 2,
          field: 'data_vencimento',
          message: 'Data inválida (use formato: AAAA-MM-DD)'
        });
      }
    }

    return { valid: errors.length === 0, errors };
  };

  const parseCSV = (file: File) => {
    setIsProcessing(true);
    setValidationErrors([]);
    setValidRows([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: ValidationError[] = [];
        const valid: CSVRow[] = [];

        results.data.forEach((row: any, index: number) => {
          const validation = validateRow(row, index);

          if (validation.valid) {
            valid.push({
              title: row.titulo.trim(),
              description: row.descricao?.trim() || '',
              priority: row.prioridade?.toLowerCase() as 'baixa' | 'moderada' | 'alta' | undefined,
              dueDate: row.data_vencimento?.trim() || undefined,
            });
          } else {
            errors.push(...validation.errors);
          }
        });

        setValidationErrors(errors);
        setValidRows(valid);
        setIsProcessing(false);
      },
      error: (error) => {
        console.error('Erro ao processar CSV:', error);
        setValidationErrors([{
          row: 0,
          field: 'file',
          message: 'Erro ao processar arquivo CSV'
        }]);
        setIsProcessing(false);
      }
    });
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('token');
      const cardsToCreate = validRows.map((row, index) => ({
        columnId,
        title: row.title,
        description: row.description || '',
        priority: row.priority || 'moderada',
        dueDate: row.dueDate || null,
        position: index
      }));

      const createdCards = [];

      // Criar cards sequencialmente
      for (const cardData of cardsToCreate) {
        const response = await fetch('http://localhost:3000/kanban/cards', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cardData),
        });

        if (!response.ok) {
          throw new Error(`Erro ao criar card: ${cardData.title}`);
        }

        const result = await response.json();
        createdCards.push(result.card);
      }

      onImportSuccess(createdCards);
      onOpenChange(false);

      // Reset state
      setFile(null);
      setValidRows([]);
      setValidationErrors([]);
    } catch (error) {
      console.error('Erro ao importar cards:', error);
      setValidationErrors([{
        row: 0,
        field: 'import',
        message: 'Erro ao importar cards. Tente novamente.'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setValidRows([]);
    setValidationErrors([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Cards via CSV
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV para criar múltiplos cards nesta coluna
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Upload Area */}
          {!file && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
              }`}
            >
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Arraste e solte seu arquivo CSV aqui ou
              </p>
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Button type="button" variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>
                  Selecionar Arquivo
                </Button>
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* File Info */}
          {file && (
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Remover
              </Button>
            </div>
          )}

          {/* CSV Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Formato esperado do CSV
            </h4>
            <p className="text-sm text-blue-800 mb-2">
              O arquivo deve conter as seguintes colunas (separadas por vírgula):
            </p>
            <code className="block bg-white p-2 rounded text-xs overflow-x-auto">
              titulo,descricao,prioridade,data_vencimento
            </code>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
              <li>• <strong>titulo</strong>: Nome da tarefa (obrigatório)</li>
              <li>• <strong>descricao</strong>: Detalhes da tarefa (opcional)</li>
              <li>• <strong>prioridade</strong>: baixa, moderada ou alta (opcional)</li>
              <li>• <strong>data_vencimento</strong>: Prazo no formato AAAA-MM-DD, ex: 2025-12-31 (opcional)</li>
            </ul>
          </div>

          {/* Validation Results */}
          {!isProcessing && file && (
            <div className="space-y-3">
              {/* Valid Rows */}
              {validRows.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {validRows.length} card{validRows.length !== 1 ? 's' : ''} válido{validRows.length !== 1 ? 's' : ''}
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {validRows.map((row, index) => (
                      <div key={index} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{row.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {validationErrors.length} erro{validationErrors.length !== 1 ? 's' : ''} encontrado{validationErrors.length !== 1 ? 's' : ''}
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800">
                        <strong>Linha {error.row}</strong> ({error.field}): {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Button */}
          {validRows.length > 0 && (
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing || validRows.length === 0}
                className="gradient-primary"
              >
                {isProcessing ? (
                  <>Importando...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar {validRows.length} Card{validRows.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
