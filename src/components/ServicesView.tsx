import React, { useState } from 'react';
import { 
  FileCheck2, 
  Car, 
  Ship, 
  Compass, 
  Sun, 
  Layers,
  Sparkles,
  Ticket,
  Plane,
  Building2
} from 'lucide-react';
import { 
  VisaService, 
  TransferService, 
  CruiseService, 
  TourService, 
  DayTripService, 
  Supplier,
  Flight,
  Hotel
} from '../types';
import { VisasView } from './VisasView';
import { TransfersView } from './TransfersView';
import { CruisesView } from './CruisesView';
import { ToursView } from './ToursView';
import { DayTripsView } from './DayTripsView';
import { FlightsView } from './FlightsView';
import { HotelsView } from './HotelsView';

import { CurrencyHighlight } from './CurrencyHighlight';

interface ServicesViewProps {
  initialSubTab?: 'visas' | 'flights' | 'hotels' | 'transfers' | 'cruises' | 'tours' | 'day-trips';
  userRole?: any;
  visas: VisaService[];
  flights?: Flight[];
  hotels?: Hotel[];
  transfers: TransferService[];
  cruises: CruiseService[];
  tours: TourService[];
  dayTrips: DayTripService[];
  suppliers?: Supplier[];
  settings?: any;
  packages?: any[];
  currentCurrency?: string;
  customers?: any[];
  onAddVisa: (data: Partial<VisaService>) => void;
  onUpdateVisa: (id: string, data: Partial<VisaService>) => void;
  onDeleteVisa: (id: string) => void;
  onAddFlight?: (data: Partial<Flight>) => void;
  onUpdateFlight?: (id: string, data: Partial<Flight>) => void;
  onDeleteFlight?: (id: string) => void;
  onAddHotel?: (data: Partial<Hotel>) => void;
  onUpdateHotel?: (id: string, data: Partial<Hotel>) => void;
  onDeleteHotel?: (id: string) => void;
  onAddTransfer: (data: Partial<TransferService>) => void;
  onUpdateTransfer: (id: string, data: Partial<TransferService>) => void;
  onDeleteTransfer: (id: string) => void;
  onAddCruise: (data: Partial<CruiseService>) => void;
  onUpdateCruise: (id: string, data: Partial<CruiseService>) => void;
  onDeleteCruise?: (id: string) => void;
  onAddTour: (data: Partial<TourService>) => void;
  onUpdateTour: (id: string, data: Partial<TourService>) => void;
  onDeleteTour?: (id: string) => void;
  onAddDayTrip: (data: Partial<DayTripService>) => void;
  onUpdateDayTrip: (id: string, data: Partial<DayTripService>) => void;
  onDeleteDayTrip?: (id: string) => void;
  onCreateVoucherForService: (category: any, service: any) => void;
}

export function ServicesView({
  initialSubTab = 'visas',
  userRole = 'Administrator',
  visas = [],
  flights = [],
  hotels = [],
  transfers = [],
  cruises = [],
  tours = [],
  dayTrips = [],
  suppliers = [],
  settings,
  packages,
  currentCurrency,
  customers = [],
  onAddVisa,
  onUpdateVisa,
  onDeleteVisa,
  onAddFlight = () => {},
  onUpdateFlight = () => {},
  onDeleteFlight = () => {},
  onAddHotel = () => {},
  onUpdateHotel = () => {},
  onDeleteHotel = () => {},
  onAddTransfer,
  onUpdateTransfer,
  onDeleteTransfer,
  onAddCruise,
  onUpdateCruise,
  onDeleteCruise = () => {},
  onAddTour,
  onUpdateTour,
  onDeleteTour = () => {},
  onAddDayTrip,
  onUpdateDayTrip,
  onDeleteDayTrip = () => {},
  onCreateVoucherForService
}: ServicesViewProps) {
  const [activeTab, setActiveTab] = useState<'visas' | 'flights' | 'hotels' | 'transfers' | 'cruises' | 'tours' | 'day-trips'>(initialSubTab);

  const tabs = [
    { id: 'visas', label: 'Visa Processing', icon: FileCheck2, count: visas.length, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'flights', label: 'Flight Tickets', icon: Plane, count: flights.length, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'hotels', label: 'Hotels & Lodging', icon: Building2, count: hotels.length, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'transfers', label: 'Transfers & Fleet', icon: Car, count: transfers.length, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { id: 'cruises', label: 'Nile & Sea Cruises', icon: Ship, count: cruises.length, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'tours', label: 'Guided Tours', icon: Compass, count: tours.length, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'day-trips', label: 'Day Trips & Safaris', icon: Sun, count: dayTrips.length, color: 'text-amber-600 bg-amber-50 border-amber-200' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Sub-navigation bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-900 text-white rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tourism Services Catalog</span>
            <div className="hidden sm:flex items-center gap-1 ml-2 border-l border-slate-200 pl-2">
              <span className="text-[10px] text-slate-400 font-medium">Currencies:</span>
              <CurrencyHighlight symbolOnly currency="USD" />
              <CurrencyHighlight symbolOnly currency="EGP" />
              <CurrencyHighlight symbolOnly currency="EUR" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? `${tab.color} shadow-xs font-extrabold`
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    isActive ? 'bg-white/80 font-black' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1">
        {activeTab === 'visas' && (
          <VisasView
            visas={visas}
            suppliers={suppliers}
            customers={customers}
            userRole={userRole}
            onAddVisa={onAddVisa}
            onUpdateVisa={onUpdateVisa}
            onDeleteVisa={onDeleteVisa}
            onCreateVoucherForService={onCreateVoucherForService}
          />
        )}

        {activeTab === 'flights' && (
          <FlightsView
            flights={flights}
            userRole={userRole}
            onAddFlight={onAddFlight}
            onUpdateFlight={onUpdateFlight}
            onDeleteFlight={onDeleteFlight}
            onCreateVoucherForService={onCreateVoucherForService}
          />
        )}

        {activeTab === 'hotels' && (
          <HotelsView
            hotels={hotels}
            customers={customers}
            userRole={userRole}
            onAddHotel={onAddHotel}
            onUpdateHotel={onUpdateHotel}
            onDeleteHotel={onDeleteHotel}
            onCreateVoucherForService={onCreateVoucherForService}
          />
        )}

        {activeTab === 'transfers' && (
          <TransfersView
            transfers={transfers}
            suppliers={suppliers}
            userRole={userRole}
            onAddTransfer={onAddTransfer}
            onUpdateTransfer={onUpdateTransfer}
            onDeleteTransfer={onDeleteTransfer}
            onCreateVoucherForService={onCreateVoucherForService}
          />
        )}

        {activeTab === 'cruises' && (
          <CruisesView
            cruises={cruises}
            suppliers={suppliers}
            userRole={userRole}
            onAddCruise={onAddCruise}
            onUpdateCruise={onUpdateCruise}
            onDeleteCruise={onDeleteCruise}
            onCreateVoucherForService={onCreateVoucherForService}
          />
        )}

        {activeTab === 'tours' && (
          <ToursView
            tours={tours}
            suppliers={suppliers}
            userRole={userRole}
            onAddTour={onAddTour}
            onUpdateTour={onUpdateTour}
            onDeleteTour={onDeleteTour}
            onCreateVoucherForService={onCreateVoucherForService}
          />
        )}

        {activeTab === 'day-trips' && (
          <DayTripsView
            dayTrips={dayTrips}
            suppliers={suppliers}
            userRole={userRole}
            onAddDayTrip={onAddDayTrip}
            onUpdateDayTrip={onUpdateDayTrip}
            onDeleteDayTrip={onDeleteDayTrip}
            onCreateVoucherForService={onCreateVoucherForService}
          />
        )}
      </div>
    </div>
  );
}
