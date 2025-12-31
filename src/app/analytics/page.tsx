'use client';

import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
  FileText,
  Download,
  BarChart,
  Users2,
  Package,
  FileDigit,
  Share2,
  Eye,
  LayoutGrid,
  MessageSquare,
  ThumbsUp,
  Network,
  ListTree,
  Home,
  MonitorSmartphone,
  History,
  UserCheck,
  TrendingUp,
  Clock,
  Save,
  Star,
  MessageCircle,
  MousePointerClick,
  Map,
  BrainCircuit,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
} from 'recharts';
import * as React from 'react';
import Link from 'next/link';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';

import { Input } from '@/components/ui/input';
import { initialContent } from '@/lib/initial-content';
import backendData from '@/../docs/backend.json';
import dynamic from 'next/dynamic';
import type { EdgeData, NodeData } from 'reaflow';
import { cn } from '@/lib/utils';
import { PROJECT_OVERVIEW } from '@/lib/project-docs';
import { ZoomableSection } from '@/components/zoomable-section';

const Canvas = dynamic(() => import('reaflow').then(mod => mod.Canvas), { ssr: false });
const Node = dynamic(() => import('reaflow').then(mod => mod.Node), { ssr: false });

// Mock Data
export const usersData = [
  {
    id: 'usr_1',
    name: 'Doruk Karlıkaya',
    email: 'doruk@example.com',
    role: 'Admin',
    lastLogin: '2 dakika önce',
    contentCount: 42,
  },
  {
    id: 'usr_2',
    name: 'Zeynep Yılmaz',
    email: 'zeynep@example.com',
    role: 'Editor',
    lastLogin: '1 saat önce',
    contentCount: 15,
  },
  {
    id: 'usr_3',
    name: 'Ahmet Çelik',
    email: 'ahmet@example.com',
    role: 'Viewer',
    lastLogin: 'dün',
    contentCount: 5,
  },
  {
    id: 'usr_4',
    name: 'Guest',
    email: 'anonymous@example.com',
    role: 'Anonymous',
    lastLogin: 'az önce',
    contentCount: 1,
  },
];

type User = typeof usersData[0];

const userColumns: any[] = [
  {
    accessorKey: 'name',
    header: 'Kullanıcı',
    cell: ({ row }: any) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={`https://avatar.vercel.sh/${row.original.name}.png`}
            alt={row.original.name}
          />
          <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <Link href={`/analytics/users/${row.original.id}`} className="font-medium text-primary hover:underline">
            {row.getValue('name')}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'E-posta',
  },
  {
    accessorKey: 'role',
    header: 'Rol',
  },
  {
    accessorKey: 'lastLogin',
    header: 'Son Giriş',
  },
  {
    accessorKey: 'contentCount',
    header: 'İçerik Sayısı',
    cell: ({ row }: any) => (
      <div className="text-center">{row.getValue('contentCount')}</div>
    ),
  },
];

type Content = typeof initialContent[0];
const contentColumns: any[] = [
  {
    accessorKey: 'title',
    header: 'Başlık',
  },
  {
    accessorKey: 'type',
    header: 'Tür',
  },
  {
    accessorKey: 'createdAt',
    header: 'Oluşturulma',
    cell: ({ row }: any) => new Date(row.getValue('createdAt') as string).toLocaleDateString(),
  },
  {
    accessorKey: 'itemCount',
    header: 'Alt Öğeler',
    cell: ({ row }: any) => (
      <div className="text-center">{row.getValue('itemCount') || 0}</div>
    ),
  },
  {
    accessorKey: 'averageRating',
    header: 'Puan',
    cell: ({ row }: any) => (
      <div className="text-center">
        {(row.getValue('averageRating') || 0).toFixed(1)}
      </div>
    ),
  },
];

const barChartData = [
  { name: 'Ocak', users: 12, content: 30 },
  { name: 'Şubat', users: 19, content: 45 },
  { name: 'Mart', users: 25, content: 60 },
  { name: 'Nisan', users: 32, content: 78 },
  { name: 'Mayıs', users: 45, content: 110 },
  { name: 'Haziran', users: 52, content: 130 },
];

const userSegmentData = [
    { name: 'Güçlü Kullanıcı', value: 400, fill: 'hsl(var(--primary))' },
    { name: 'Aktif Kullanıcı', value: 300, fill: 'hsl(var(--primary) / 0.8)' },
    { name: 'Ara Sıra Giren', value: 300, fill: 'hsl(var(--primary) / 0.6)' },
    { name: 'Yeni Kullanıcı', value: 200, fill: 'hsl(var(--primary) / 0.4)' },
];

const featureUsageData = [
  { name: 'Tuval Oluşturma', usage: 4000 },
  { name: 'Puanlama', usage: 3000 },
  { name: 'Paylaşım', usage: 2000 },
  { name: 'Yorum Yapma', usage: 2780 },
  { name: 'AI Asistan', usage: 1890 },
];

export const logsData = [
  {
    id: 'log_1',
    user: 'Doruk Karlıkaya',
    event: 'Uygulama Başlatıldı',
    loadingTime: 1240,
    foldersOpenTime: 450,
    personalFoldersLoadTime: 1800,
    device: {
      os: 'Windows 11',
      browser: 'Chrome',
      version: '120.0.6099.129',
      cpu: '16 Cores',
      ram: '32 GB',
      gpu: 'NVIDIA GeForce RTX 3080',
    },
    timestamp: '2025-12-24 10:30:00',
  },
  {
    id: 'log_2',
    user: 'Zeynep Yılmaz',
    event: 'Tuval Değiştirildi',
    loadingTime: 850,
    foldersOpenTime: 320,
    personalFoldersLoadTime: 1200,
    device: {
      os: 'macOS Sonoma',
      browser: 'Safari',
      version: '17.2.1',
      cpu: '8 Cores (M2)',
      ram: '16 GB',
      gpu: 'Apple M2 GPU',
    },
    timestamp: '2025-12-24 11:15:22',
  },
  {
    id: 'log_3',
    user: 'Ahmet Çelik',
    event: 'AI Analizi Başlatıldı',
    loadingTime: 2100,
    foldersOpenTime: 600,
    personalFoldersLoadTime: 2500,
    device: {
      os: 'Ubuntu 22.04',
      browser: 'Firefox',
      version: '121.0',
      cpu: '12 Cores',
      ram: '64 GB',
      gpu: 'AMD Radeon RX 6700 XT',
    },
    timestamp: '2025-12-24 12:05:45',
  },
  {
    id: 'log_4',
    user: 'Guest',
    event: 'Sayfa Yüklendi',
    loadingTime: 1500,
    foldersOpenTime: 500,
    personalFoldersLoadTime: 2000,
    device: {
      os: 'iOS 17.2',
      browser: 'Mobile Safari',
      version: '17.2',
      cpu: '6 Cores',
      ram: '6 GB',
      gpu: 'Apple A17 Pro GPU',
    },
    timestamp: '2025-12-24 12:45:10',
  },
];

const logColumns: any[] = [
  {
    accessorKey: 'timestamp',
    header: 'Zaman Damgası',
  },
  {
    accessorKey: 'user',
    header: 'Kullanıcı',
  },
  {
    accessorKey: 'event',
    header: 'Olay',
  },
  {
    accessorKey: 'loadingTime',
    header: 'Yükleme (ms)',
    cell: ({ row }: any) => (
      <div className="font-mono text-xs">{row.getValue('loadingTime')}ms</div>
    ),
  },
  {
    accessorKey: 'foldersOpenTime',
    header: 'Klasör Açılış (ms)',
    cell: ({ row }: any) => (
      <div className="font-mono text-xs">{row.getValue('foldersOpenTime')}ms</div>
    ),
  },
  {
    accessorKey: 'personalFoldersLoadTime',
    header: 'Kişisel Klasör (ms)',
    cell: ({ row }: any) => (
      <div className="font-mono text-xs">{row.getValue('personalFoldersLoadTime')}ms</div>
    ),
  },
  {
    accessorKey: 'device',
    header: 'Cihaz Bilgisi',
    cell: ({ row }: any) => {
      const device = row.original.device;
      return (
        <div className="text-[10px] leading-tight">
          <div>{device.os} - {device.browser} ({device.version})</div>
          <div className="text-muted-foreground">{device.cpu} | {device.ram} | {device.gpu}</div>
        </div>
      );
    },
  },
];

function LogsTable() {
  const [sorting, setSorting] = React.useState<any[]>([]);
  const [columnFilters, setColumnFilters] = React.useState<any[]>([]);

  const table = useReactTable({
    data: logsData,
    columns: logColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Olay veya kullanıcı ile filtrele..."
          value={(table.getColumn('event')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('event')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                  <TableHead key={header.id} className="text-primary/80">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={logColumns.length} className="h-24 text-center">
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Geri
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          İleri
        </Button>
      </div>
    </div>
  );
}


function UsersTable() {
  const [sorting, setSorting] = React.useState<any[]>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<any[]>([]);

  const table = useReactTable({
    data: usersData,
    columns: userColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Kullanıcı adı veya e-posta ile filtrele..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => {
                  return (
                    <TableHead key={header.id} className="text-primary/80">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={userColumns.length}
                  className="h-24 text-center"
                >
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ContentTable() {
  const [sorting, setSorting] = React.useState<any[]>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<any[]>([]);
  const table = useReactTable({
    data: initialContent,
    columns: contentColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="İçerik başlığına göre filtrele..."
          value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('title')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => {
                  return (
                    <TableHead key={header.id} className="text-primary/80">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={contentColumns.length}
                  className="h-24 text-center"
                >
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EntityDiagram() {
  const { entities, firestore } = backendData;
  const nodes: NodeData[] = [];
  const edges: EdgeData[] = [];

  // Add all entities as nodes
  Object.entries(entities).forEach(([key, entity]) => {
    nodes.push({
      id: key,
      text: entity.title,
      width: 220,
      height: Object.keys(entity.properties).length * 20 + 50,
    });
  });

  // Create edges based on Firestore structure and property references
  firestore.structure.forEach(col => {
    const fromEntityNameMatch = col.path.match(/\/users\/\{userId\}\/([a-zA-Z]+)\/\{/);
    let fromEntity: string | null = null;
    
    if (col.path.startsWith('/users/{userId}') && !fromEntityNameMatch) {
      fromEntity = 'User';
    } else if (fromEntityNameMatch) {
        // Find the singular entity name from the plural collection path
        const pluralPath = fromEntityNameMatch[1];
        const singularGuess = pluralPath.endsWith('s') ? pluralPath.slice(0, -1) : pluralPath;
        const entityKey = Object.keys(entities).find(k => k.toLowerCase() === singularGuess.toLowerCase());
        if(entityKey) fromEntity = entityKey;
    }


    const toEntity = col.definition.entityName;
    
    // Create edge if fromEntity and toEntity are different
    if (fromEntity && toEntity && fromEntity !== toEntity) {
        const edgeId = `${fromEntity}-${toEntity}-${col.path}`;
        if (!edges.some(e => e.id === edgeId)) {
            edges.push({ id: edgeId, from: fromEntity, to: toEntity, text: '1:N' });
        }
    }
  });


  return (
    <ZoomableSection 
      title="Veri Mimarisi"
      description="Uygulamanın temel veri varlıkları ve aralarındaki ilişkiler."
      containerClassName="h-[80vh]"
    >
      <Canvas
        nodes={nodes}
        edges={edges}
        direction="RIGHT"
        fit
        node={
          <Node style={{ stroke: 'hsl(var(--primary))' }}>
            {({ node }: { node: any }) => (
              <foreignObject height={node.height} width={node.width} x={0} y={0}>
                <div className="w-full h-full border-2 rounded-lg bg-card p-2 text-foreground pointer-events-none">
                  <p className="font-bold text-center border-b pb-1 mb-1">{node.text}</p>
                  <ul className="text-xs space-y-0.5">
                    {Object.entries((entities as any)[node.id]?.properties || {}).map(([prop, propDef]: [string, any]) => (
                      <li key={prop} className="flex justify-between items-center">
                        <span>- {prop}</span>
                        <span className="text-muted-foreground/80 font-mono text-[10px]">{propDef.type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </foreignObject>
            )}
          </Node>
        }
      />
    </ZoomableSection>
  )
}

function ApplicationMap() {
    const nodes: NodeData[] = [
      { id: 'main-engine', text: 'Ana Motor (Reducer)', width: 250, height: 120, data: { description: 'Uygulamanın beyni. `useReducer` ile tüm state yönetilir. Veri ekleme/silme/güncelleme mantığı buradadır.' } },
      { id: 'canvas', text: 'Görsel Tuval', width: 250, height: 150, data: { description: 'Izgara, serbest, yayıncı gibi çoklu düzen modlarını destekler. `PlayerFrame` aracılığıyla öğeleri render eder.' } },
      { id: 'player-frame', text: 'Oynatıcı Çerçevesi', width: 200, height: 100, data: { description: 'Her bir `ContentItem` için başlık, menü, stil ve animasyonları yöneten sarmalayıcı.' } },
      { id: 'primary-sidebar', text: 'Birincil Kenar Çubuğu', width: 200, height: 100, data: { description: 'Ana gezinme: Kitaplık, Sosyal, Ayarlar, Profil...' } },
      { id: 'secondary-sidebar', text: 'İkincil Kenar Çubuğu', width: 200, height: 120, data: { description: 'Seçime göre içerik gösterir (Kitaplık Ağacı, Sosyal Akış, Sohbetler, Bildirimler).' } },
      { id: 'ui-elements', text: 'Arayüz Elemanları', width: 200, height: 120, data: { description: 'Stil Ayarları, Paylaşım Diyaloğu, Önizleme, Bilgi Paneli gibi tüm yardımcı pencereler.' } },
      { id: 'global-search', text: 'Global Arama & Komut', width: 220, height: 100, data: { description: '`Ctrl+K` ile açılan, AI asistanına ve içerik aramasına erişim sağlayan merkezi pencere.' } },
      { id: 'data-structure', text: 'Veri Yapısı: ContentItem', width: 250, height: 150, data: { description: 'Uygulamadaki her şeyi (klasör, video, widget, not) temsil eden temel nesne. `ratings`, `metrics`, `sharing` gibi zenginleştirilmiş alanlar içerir.' } },
      { id: 'ai-assistant', text: 'Yapay Zeka Asistanı', width: 250, height: 150, data: { description: 'Genkit tabanlı. Arayüze rehberlik (`highlightElement`), web araması (`googleSearch`) ve tuvale içerik ekleme (`addPlayerTool`) gibi araçları kullanır.' } },
      { id: 'sharing-embedding', text: 'Paylaşma & Gömme', width: 220, height: 100, data: { description: '`ShareDialog` üzerinden URL, QR Kod ve `iframe` kodu üreterek içeriğin dışa aktarılmasını sağlar.' } }
    ];

    const edges: EdgeData[] = [
        { id: 'e1', from: 'main-engine', to: 'canvas', text: 'Veri ve Fonksiyon Aktarımı' },
        { id: 'e2', from: 'primary-sidebar', to: 'main-engine', text: 'Bölüm/Görünüm Değiştirir' },
        { id: 'e3', from: 'secondary-sidebar', to: 'main-engine', text: 'Aktif Görünümü Ayarlar' },
        { id: 'e4', from: 'ui-elements', to: 'main-engine', text: 'Ayar & Eylem Tetikler' },
        { id: 'e5', from: 'main-engine', to: 'data-structure', text: 'Veri Okuma/Yazma (CRUD)' },
        { id: 'e6', from: 'ai-assistant', to: 'main-engine', text: 'Arayüz Eylemi Sinyali' },
        { id: 'e7', from: 'global-search', to: 'ai-assistant', text: 'Komut Gönderir' },
        { id: 'e8', from: 'global-search', to: 'main-engine', text: 'İçerik Seçimi Bildirir' },
        { id: 'e9', from: 'canvas', to: 'player-frame', text: 'Öğeleri Render Eder' },
        { id: 'e10', from: 'sharing-embedding', to: 'data-structure', text: 'Paylaşım URL\'si Oluşturur' },
        { id: 'e11', from: 'player-frame', to: 'sharing-embedding', text: 'Paylaşım Diyaloğunu Açar' },
        { id: 'e12', from: 'secondary-sidebar', to: 'data-structure', text: 'Veri Hiyerarşisini Okur' }
    ];
    
    return (
        <ZoomableSection 
          title="Uygulama Haritası"
          description="Uygulamanın ana bileşenlerinin ve özelliklerinin şematik görünümü."
          containerClassName="h-[80vh]"
        >
          <Canvas
            nodes={nodes}
            edges={edges}
            direction="DOWN"
            fit
            node={
              <Node style={{ stroke: 'hsl(var(--primary))' }}>
                {({ node }: { node: any }) => (
                  <foreignObject height={node.height} width={node.width} x={0} y={0}>
                    <div className="w-full h-full border-2 rounded-lg bg-card p-2 text-foreground flex flex-col pointer-events-none">
                      <p className="font-bold text-center border-b pb-1 mb-1">{node.text}</p>
                      <p className="text-xs text-muted-foreground flex-1">{node.data.description}</p>
                    </div>
                  </foreignObject>
                )}
              </Node>
            }
          />
        </ZoomableSection>
    )
}

function DeepLearningInsights() {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [insights, setInsights] = React.useState<string[]>([]);
  const [prediction, setPrediction] = React.useState<string>("");

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate offline deep learning analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    setInsights([
      "Kullanıcılar en çok video içerikleriyle etkileşime giriyor.",
      "Akşam saatlerinde (20:00 - 22:00) kullanım yoğunluğu artıyor.",
      "Eğitim kategorisindeki içerikler daha uzun süre izleniyor.",
      "Mobil cihazlardan gelen trafik hafta sonları %30 artış gösteriyor."
    ]);
    setPrediction("Gelecek hafta video içeriklerine olan ilginin %15 artması bekleniyor.");
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            Çevrimdışı Derin Öğrenme Analizi
          </CardTitle>
          <CardDescription>
            Cihazınızda yerel olarak çalışan derin öğrenme modelleri ile kullanım verilerini analiz edin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? "Analiz Ediliyor..." : "Analizi Başlat"}
          </Button>
          
          {insights.length > 0 && (
            <div className="mt-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Önemli Öngörüler
                </h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  {insights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
              
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Gelecek Tahmini
                </h4>
                <p className="text-sm text-primary/80">{prediction}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Analizler</h2>
                <p className="text-muted-foreground">
                  Uygulama performansı ve kullanıcı etkileşimlerini takip edin.
                </p>
              </div>
              <div className="flex items-center gap-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="h-8 gap-1">
                        <Download className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                          Rapor İndir
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Raporlar</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Veri Mimarisi (PDF)</DropdownMenuItem>
                      <DropdownMenuItem>Uygulama Haritası (PDF)</DropdownMenuItem>
                      <DropdownMenuItem>Kullanıcı Raporu (CSV)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center overflow-x-auto no-scrollbar mb-6">
              <TabsList className="h-10 inline-flex w-auto justify-start bg-muted/50 p-1">
                <TabsTrigger value="dashboard" className="px-4"><BarChart className="mr-2 h-4 w-4" />Genel Bakış</TabsTrigger>
                <TabsTrigger value="users" className="px-4"><Users2 className="mr-2 h-4 w-4" />Kullanıcılar</TabsTrigger>
                <TabsTrigger value="content" className="px-4"><Package className="mr-2 h-4 w-4" />İçerik</TabsTrigger>
                <TabsTrigger value="interaction" className="px-4"><MousePointerClick className="mr-2 h-4 w-4" />Etkileşim Analizi</TabsTrigger>
                <TabsTrigger value="architecture" className="px-4"><Network className="mr-2 h-4 w-4" />Veri Mimarisi</TabsTrigger>
                <TabsTrigger value="app-map" className="px-4"><Map className="mr-2 h-4 w-4" />Uygulama Haritası</TabsTrigger>
                <TabsTrigger value="ai-insights" className="px-4"><BrainCircuit className="mr-2 h-4 w-4" />AI Öngörüleri</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="cursor-pointer hover:border-primary" onClick={() => setActiveTab('users')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Toplam Kullanıcı
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{usersData.length}</div>
                    <p className="text-xs text-muted-foreground">
                      +%1.2 geçen aydan
                    </p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-primary" onClick={() => setActiveTab('content')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aktif İçerik Sayısı
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {initialContent.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +180.1% son 1 ayda
                    </p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-primary" onClick={() => setActiveTab('interaction')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Etkileşim Oranı
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+12,234</div>
                    <p className="text-xs text-muted-foreground">
                      +19% son 1 ayda
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Blockchain İşlemleri
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      (Entegrasyon Bekleniyor)
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Kullanıcı ve İçerik Artışı</CardTitle>
                  <CardDescription>
                    Son 6 aydaki yeni kullanıcı ve içerik sayıları.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="hsl(var(--primary))" name="Yeni Kullanıcılar" />
                      <Bar dataKey="content" fill="hsl(var(--accent))" name="Yeni İçerikler" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="users">
                <Tabs defaultValue="list" className="w-full">
                    <TabsList>
                        <TabsTrigger value="list"><Users2 className="mr-2 h-4 w-4"/>Kullanıcı Listesi</TabsTrigger>
                        <TabsTrigger value="usage"><TrendingUp className="mr-2 h-4 w-4"/>Kullanım Analizleri</TabsTrigger>
                    </TabsList>
                    <TabsContent value="list" className="mt-4">
                        <Card>
                            <CardHeader>
                            <CardTitle>Kullanıcı Yönetimi</CardTitle>
                            <CardDescription>
                                Uygulamadaki kullanıcıları görüntüleyin ve yönetin.
                            </CardDescription>
                            </CardHeader>
                            <CardContent>
                            <UsersTable />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="usage" className="mt-4">
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5"/> Ortalama Oturum Süresi</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">12 dk 45 sn</p>
                                    <p className="text-xs text-muted-foreground">+%5.2 geçen haftaya göre</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5"/>Özellik Popülerliği</CardTitle>
                                </CardHeader>
                                <CardContent className="h-60">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsBarChart data={featureUsageData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis type="category" dataKey="name" width={110} fontSize={12}/>
                                            <Tooltip />
                                            <Bar dataKey="usage" fill="hsl(var(--accent))" name="Kullanım" />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><UserCheck className="h-5 w-5"/>Aktif Kullanıcı Segmentleri</CardTitle>
                                </CardHeader>
                                <CardContent className="h-60">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={userSegmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                                 {userSegmentData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                         </div>
                    </TabsContent>
                </Tabs>
            </TabsContent>
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle>İçerik Veritabanı</CardTitle>
                  <CardDescription>
                    Uygulamadaki tüm içerik öğelerini görüntüleyin.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContentTable />
                </CardContent>
              </Card>
            </TabsContent>
             <TabsContent value="interaction">
                 <Tabs defaultValue="saves" className="w-full">
                    <TabsList>
                        <TabsTrigger value="saves"><Save className="mr-2 h-4 w-4"/>Kaydetme</TabsTrigger>
                        <TabsTrigger value="ratings"><Star className="mr-2 h-4 w-4"/>Puanlama</TabsTrigger>
                        <TabsTrigger value="likes"><ThumbsUp className="mr-2 h-4 w-4"/>Beğeni</TabsTrigger>
                        <TabsTrigger value="comments"><MessageCircle className="mr-2 h-4 w-4"/>Yorum</TabsTrigger>
                        <TabsTrigger value="shares"><Share2 className="mr-2 h-4 w-4"/>Paylaşım</TabsTrigger>
                        <TabsTrigger value="logs"><History className="mr-2 h-4 w-4"/>Log Kayıtları</TabsTrigger>
                    </TabsList>
                    <TabsContent value="saves" className="mt-4"><p>Kaydetme analizleri burada yer alacak.</p></TabsContent>
                    <TabsContent value="ratings" className="mt-4"><p>Puanlama analizleri burada yer alacak.</p></TabsContent>
                    <TabsContent value="likes" className="mt-4"><p>Beğeni analizleri burada yer alacak.</p></TabsContent>
                    <TabsContent value="comments" className="mt-4"><p>Yorum analizleri burada yer alacak.</p></TabsContent>
                    <TabsContent value="shares" className="mt-4"><p>Paylaşım analizleri burada yer alacak.</p></TabsContent>
                    <TabsContent value="logs" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sistem ve Etkileşim Logları</CardTitle>
                                <CardDescription>
                                    Kullanıcı etkileşimleri, yükleme süreleri ve cihaz bilgilerini takip edin.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <LogsTable />
                            </CardContent>
                        </Card>
                    </TabsContent>
                 </Tabs>
            </TabsContent>
            <TabsContent value="architecture"><EntityDiagram /></TabsContent>
            <TabsContent value="app-map"><ApplicationMap /></TabsContent>
            <TabsContent value="spaces-analytics"><p>Mekan analizleri burada yer alacak.</p></TabsContent>
            <TabsContent value="devices-analytics"><p>Cihaz analizleri burada yer alacak.</p></TabsContent>
            <TabsContent value="events-analytics"><p>Olay bazlı analizler burada yer alacak.</p></TabsContent>
            <TabsContent value="view-analytics"><p>Görünüm ve ızgara modu analizleri burada yer alacak.</p></TabsContent>
            <TabsContent value="ai-insights">
              <DeepLearningInsights />
            </TabsContent>
            <TabsContent value="social-analytics"><p>Sosyal ve mesajlaşma analizleri burada yer alacak.</p></TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
