import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInventory } from "@/contexts/InventoryContext";
import AppShell from "@/components/AppShell";
import NotificationPanel from "@/components/NotificationPanel";
import LoginPage from "@/pages/LoginPage";
import LotIdentification from "@/pages/LotIdentification";
import ProductIdentification from "@/pages/ProductIdentification";
import WarehouseMap from "@/pages/WarehouseMap";
import AdminPanel from "@/pages/AdminPanel";

const Index: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { finishLot, finishLotWithoutLocation, placePallet } = useInventory();
  const [page, setPage] = useState("lots");
  const [activeLotId, setActiveLotId] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mapSelectMode, setMapSelectMode] = useState<{ lotId: string } | null>(null);

  if (!user) return <LoginPage />;

  // Block admin page for non-admins
  const safePage = page === "admin" && !isAdmin ? "lots" : page;

  const handleStartLot = (lotId: string) => setActiveLotId(lotId);
  const handleBackToLots = () => setActiveLotId(null);

  const handleFinishLot = (lotId: string) => {
    setMapSelectMode({ lotId });
    setPage("map");
  };

  const handleAddressLot = (lotId: string) => {
    setMapSelectMode({ lotId });
    setPage("map");
  };

  const handlePalletSelect = async (address: string) => {
    if (!mapSelectMode) return;
    const parts = address.split("-");
    const streetNum = parseInt(parts[1]);
    const col = parseInt(parts[2]);
    const level = parseInt(parts[3]);
    const streetLetters = "ABCDEFGHIJKL";
    const street = streetLetters[streetNum - 1];

    await placePallet(street, col, level, mapSelectMode.lotId);
    await finishLot(mapSelectMode.lotId, address);
    setMapSelectMode(null);
    setActiveLotId(null);
    setPage("lots");
  };

  const handleFinishWithoutLocation = async () => {
    if (!mapSelectMode) return;
    await finishLotWithoutLocation(mapSelectMode.lotId);
    setMapSelectMode(null);
    setActiveLotId(null);
    setPage("lots");
  };

  const renderContent = () => {
    if (safePage === "lots") {
      if (activeLotId) {
        return <ProductIdentification lotId={activeLotId} onBack={handleBackToLots} onFinish={handleFinishLot} />;
      }
      return <LotIdentification onStartLot={handleStartLot} onAddressLot={handleAddressLot} />;
    }
    if (safePage === "map") {
      return (
        <WarehouseMap
          selectMode={mapSelectMode ? {
            lotId: mapSelectMode.lotId,
            onSelect: handlePalletSelect,
            onCancel: () => { setMapSelectMode(null); setPage("lots"); },
            onFinishWithoutLocation: handleFinishWithoutLocation,
          } : undefined}
        />
      );
    }
    if (safePage === "admin" && isAdmin) return <AdminPanel />;
    return null;
  };

  return (
    <>
      <AppShell currentPage={safePage} onNavigate={setPage} onToggleNotifications={() => setNotifOpen(!notifOpen)}>
        {renderContent()}
      </AppShell>
      {isAdmin && <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />}
    </>
  );
};

export default Index;
