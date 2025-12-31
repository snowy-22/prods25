
"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { ContentItem } from '@/lib/initial-content';

const DigitalClockWidget = dynamic(() => import('./widgets/clock-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const NotesWidget = dynamic(() => import('./widgets/notes-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const CalendarWidget = dynamic(() => import('./widgets/calendar-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const GradientClockWidget = dynamic(() => import('./widgets/gradient-clock-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const AstronomicalClockWidget = dynamic(() => import('./widgets/astronomical-clock-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const ToDoListWidget = dynamic(() => import('./widgets/todo-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const WebsitePreview = dynamic(() => import('./widgets/WebsitePreview'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const MiniGridPreview = dynamic(() => import('./mini-grid-preview'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const PharmacyWidget = dynamic(() => import('./widgets/pharmacy-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const WeatherWidget = dynamic(() => import('./widgets/weather-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const CalculatorWidget = dynamic(() => import('./widgets/calculator-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const FinancialEngineeringWidget = dynamic(() => import('./widgets/financial-engineering-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const CurrencyConverterWidget = dynamic(() => import('./widgets/currency-converter-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const UnitConverterWidget = dynamic(() => import('./widgets/unit-converter-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const CurrencyRatesWidget = dynamic(() => import('./widgets/currency-rates-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const PlayerControlsWidget = dynamic(() => import('./widgets/player-controls-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const NavigationWidget = dynamic(() => import('./widgets/navigation-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const MediaHubWidget = dynamic(() => import('./widgets/media-hub-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const AiImageWidget = dynamic(() => import('./widgets/ai-image-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const RssFeedWidget = dynamic(() => import('./widgets/rss-feed-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const ProfileCardWidget = dynamic(() => import('./widgets/profile-card-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const ProfileShareWidget = dynamic(() => import('./widgets/profile-share-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const MindmapWidget = dynamic(() => import('./widgets/mindmap-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const BookCardWidget = dynamic(() => import('./widgets/book-card-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const AlarmClockWidget = dynamic(() => import('./widgets/alarm-clock-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const StopwatchWidget = dynamic(() => import('./widgets/stopwatch-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const TimerWidget = dynamic(() => import('./widgets/timer-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const WorldClockWidget = dynamic(() => import('./widgets/world-clock-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const MatchResultWidget = dynamic(() => import('./widgets/sports/match-result-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const LeagueTableWidget = dynamic(() => import('./widgets/sports/league-table-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const FixtureWidget = dynamic(() => import('./widgets/sports/fixture-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const PomodoroWidget = dynamic(() => import('./widgets/pomodoro-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const SocialFeedWidget = dynamic(() => import('./widgets/social-feed-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const UserListWidget = dynamic(() => import('./widgets/user-list-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const KanbanWidget = dynamic(() => import('./widgets/kanban-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const FlowchartWidget = dynamic(() => import('./widgets/flowchart-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const SwotWidget = dynamic(() => import('./widgets/swot-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const FishboneWidget = dynamic(() => import('./widgets/fishbone-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const ScreenshotWidget = dynamic(() => import('./widgets/screenshot-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const ScreenRecorderWidget = dynamic(() => import('./widgets/screen-recorder-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const QRCodeWidget = dynamic(() => import('./widgets/qrcode-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const ColorPickerWidget = dynamic(() => import('./widgets/color-picker-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const ClipboardManagerWidget = dynamic(() => import('./widgets/clipboard-manager-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const GradientGeneratorWidget = dynamic(() => import('./widgets/gradient-generator-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const LoremIpsumGeneratorWidget = dynamic(() => import('./widgets/lorem-ipsum-generator-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const BusinessModelCanvasWidget = dynamic(() => import('./widgets/business-model-canvas-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const SearchWidget = dynamic(() => import('./widgets/search-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const HueWidget = dynamic(() => import('./widgets/hue-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const ReservationWidget = dynamic(() => import('./widgets/reservation-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const PurchaseWidget = dynamic(() => import('./widgets/purchase-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const AchievementsWidget = dynamic(() => import('./widgets/achievements-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const AwardCardWidget = dynamic(() => import('./widgets/award-card-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const TrainingModuleWidget = dynamic(() => import('./widgets/training-module-widget'), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });
const NewTabScreen = dynamic(() => import('./new-tab-screen').then(m => ({ default: m.NewTabScreen })), { ssr: false, loading: () => <Skeleton className="w-full h-full" /> });

const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  item: MiniGridPreview,
  folder: MiniGridPreview,
  list: MiniGridPreview,
  player: MiniGridPreview,
  inventory: MiniGridPreview,
  space: MiniGridPreview,
  devices: MiniGridPreview,
  'saved-items': MiniGridPreview,
  'awards-folder': MiniGridPreview,
  'spaces-folder': MiniGridPreview,
  'devices-folder': MiniGridPreview,
  'trash-folder': MiniGridPreview,
  website: WebsitePreview,
  image: WebsitePreview,
  video: WebsitePreview,
  audio: WebsitePreview,
  pdf: WebsitePreview,
  map: WebsitePreview,
  '3dplayer': WebsitePreview,
  file: WebsitePreview,
  book: BookCardWidget,
  clock: (props: any) => {
    if (props.item.clockMode === 'gradient') return <GradientClockWidget {...props} />;
    if (props.item.clockMode === 'astronomical') return <AstronomicalClockWidget {...props} />;
    return <DigitalClockWidget {...props} />;
  },
  alarm: AlarmClockWidget,
  stopwatch: StopwatchWidget,
  timer: TimerWidget,
  'world-clock': WorldClockWidget,
  todolist: ToDoListWidget,
  notes: NotesWidget,
  pharmacy: PharmacyWidget,
  weather: WeatherWidget,
  calculator: CalculatorWidget,
  'financial-engineering': FinancialEngineeringWidget,
  currencyConverter: CurrencyConverterWidget,
  unitConverter: UnitConverterWidget,
  currencyRates: CurrencyRatesWidget,
  playerControls: PlayerControlsWidget,
  navigation: NavigationWidget,
  mediaHub: MediaHubWidget,
  aiImage: AiImageWidget,
  rss: RssFeedWidget,
  'profile-card': ProfileCardWidget,
  'profile-share': ProfileShareWidget,
  mindmap: MindmapWidget,
  match: MatchResultWidget,
  'match-result': MatchResultWidget,
  'league-table': LeagueTableWidget,
  fixture: FixtureWidget,
  pomodoro: PomodoroWidget,
  todo: ToDoListWidget,
  calendar: CalendarWidget,
  'social-feed': SocialFeedWidget,
  'user-list': UserListWidget,
  kanban: KanbanWidget,
  flowchart: FlowchartWidget,
  swot: SwotWidget,
  fishbone: FishboneWidget,
  screenshot: ScreenshotWidget,
  'screen-recorder': ScreenRecorderWidget,
  qrcode: QRCodeWidget,
  'color-picker': ColorPickerWidget,
  'clipboard-manager': ClipboardManagerWidget,
  'gradient-generator': GradientGeneratorWidget,
  'lorem-ipsum': LoremIpsumGeneratorWidget,
  'business-model-canvas': BusinessModelCanvasWidget,
  bmc: BusinessModelCanvasWidget,
  search: SearchWidget,
  hue: HueWidget,
  reservation: ReservationWidget,
  purchase: PurchaseWidget,
  achievements: AchievementsWidget,
  'award-card': AwardCardWidget,
  'training-module': TrainingModuleWidget,
  'new-tab': NewTabScreen,
};

const WidgetRendererBase = ({ item, ...props }: { item: ContentItem } & any) => {
    const isPreview = props.isPreview || false;
    const isSuspended = props.isSuspended || false;
    
    // Handle player type specifically to render active child
    if (item.type === 'player' && item.children && item.children.length > 0) {
        const index = item.playerIndex || 0;
        const activeChild = item.children[index];
        // Prevent infinite recursion if child is same as parent (basic check)
        if (activeChild && activeChild.id !== item.id) {
            return <WidgetRenderer item={activeChild} {...props} />;
        }
    }

    // In preview mode OR suspended mode, show only thumbnails for dynamic content (websites, videos, iframes)
    const dynamicTypes = ['website', 'video', 'iframe', '3dplayer', 'audio'];
    if ((isPreview || isSuspended) && dynamicTypes.includes(item.type)) {
        // Show thumbnail preview instead of loading full content
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/20 relative overflow-hidden">
                {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                ) : item.coverImage ? (
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="text-4xl opacity-50">🖼️</div>
                        <span className="text-xs">{item.title}</span>
                    </div>
                )}
                <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono">
                    {isSuspended ? 'Askıda' : 'Önizleme'}
                </div>
            </div>
        );
    }

    const Component = WIDGET_COMPONENTS[item.type];
    
    // Determine size based on item styles or container size
    // If width is not set (like in sidebar preview), default to small
    const width = item.styles?.width ? parseInt(item.styles.width as string) : 0;
    const size = width > 800 ? 'large' : width > 400 ? 'medium' : 'small';

    if (!Component) {
        return <WebsitePreview item={item} size={size} {...props} isSuspended={isSuspended} />;
    }
    return <Component item={item} size={size} {...props} />;
};

export const WidgetRenderer = React.memo(WidgetRendererBase);
