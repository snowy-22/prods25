'use client';

import { useState } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table as TableIcon,
  Plus,
  Download,
  Upload,
  Filter,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdvancedTableWidgetProps {
  item: ContentItem;
  onUpdate?: (updates: Partial<ContentItem>) => void;
}

export function AdvancedTableWidget({ item, onUpdate }: AdvancedTableWidgetProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - dinamik olarak yapılandırılabilir
  const columns = item.metadata?.columns || [
    { id: 'id', label: 'ID', type: 'text', sortable: true },
    { id: 'name', label: 'Ad', type: 'text', sortable: true },
    { id: 'category', label: 'Kategori', type: 'badge', sortable: true },
    { id: 'amount', label: 'Tutar', type: 'currency', sortable: true },
    { id: 'status', label: 'Durum', type: 'status', sortable: true },
    { id: 'date', label: 'Tarih', type: 'date', sortable: true }
  ];

  const data = item.metadata?.data || Array.from({ length: 45 }, (_, i) => ({
    id: `#${String(i + 1).padStart(4, '0')}`,
    name: `Ürün ${i + 1}`,
    category: ['Elektronik', 'Giyim', 'Ev & Yaşam', 'Aksesuar'][Math.floor(Math.random() * 4)],
    amount: Math.floor(Math.random() * 5000) + 100,
    status: ['active', 'pending', 'completed', 'cancelled'][Math.floor(Math.random() * 4)],
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortColumn as keyof typeof a];
        const bVal = b[sortColumn as keyof typeof b];
        const direction = sortDirection === 'asc' ? 1 : -1;
        return aVal > bVal ? direction : -direction;
      })
    : filteredData;

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const renderCell = (row: any, column: any) => {
    const value = row[column.id];

    switch (column.type) {
      case 'currency':
        return <span className="font-semibold">₺{value.toLocaleString('tr-TR')}</span>;
      
      case 'badge':
        return <Badge variant="outline">{value}</Badge>;
      
      case 'status':
        const statusVariants = {
          active: 'default',
          pending: 'secondary',
          completed: 'default',
          cancelled: 'destructive'
        } as const;
        const statusLabels = {
          active: 'Aktif',
          pending: 'Beklemede',
          completed: 'Tamamlandı',
          cancelled: 'İptal'
        };
        return (
          <Badge variant={statusVariants[value as keyof typeof statusVariants]}>
            {statusLabels[value as keyof typeof statusLabels]}
          </Badge>
        );
      
      case 'date':
        return new Date(value).toLocaleDateString('tr-TR');
      
      default:
        return value;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            {item.title || 'Gelişmiş Tablo'}
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              İçe Aktar
            </Button>
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Dışa Aktar
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Satır
            </Button>
          </div>
        </div>

        {/* Arama ve Filtreler */}
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Tabloda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button size="icon" variant="outline">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Tablo */}
        <div className="border rounded-lg flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.id}>
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort(column.id)}
                        className="flex items-center gap-2 -ml-3 h-8"
                      >
                        {column.label}
                        {sortColumn === column.id && (
                          sortDirection === 'asc' ? (
                            <SortAsc className="h-4 w-4" />
                          ) : (
                            <SortDesc className="h-4 w-4" />
                          )
                        )}
                      </Button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sayfa başına:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Toplam {sortedData.length} kayıt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki
            </Button>
            <span className="text-sm">
              Sayfa {currentPage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
