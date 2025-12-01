
import POSContainer from "@/components/POS/POSContainer";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { Helmet } from "react-helmet";
import { useEffect, useState } from "react";
import { Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TOUCH_TARGETS } from "@/constants/mobile";
import { useCurrentTeamMember } from "@/hooks/useTeamMembers";

const POS = () => {
  const { isMobile } = useDeviceDetection();
  const { data: teamMember } = useCurrentTeamMember();
  const isAdmin = teamMember?.role === 'Admin' || teamMember?.role === 'Manager';
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Log when POS component is mounted
    console.log("POS page loaded");
    
    return () => {
      console.log("POS page unmounted");
    };
  }, []);

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Helmet>
        <title>Point of Sale - Payasakkada</title>
      </Helmet>
      {isMobile ? (
        <MobileHeader 
          title="Point of Sale"
          breadcrumbs={[]}
          actions={
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                style={{
                  minWidth: `${TOUCH_TARGETS.MINIMUM}px`,
                  minHeight: `${TOUCH_TARGETS.MINIMUM}px`,
                }}
                aria-label="Search items"
              >
                <Search className="h-5 w-5" />
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSettingsOpen(true)}
                  style={{
                    minWidth: `${TOUCH_TARGETS.MINIMUM}px`,
                    minHeight: `${TOUCH_TARGETS.MINIMUM}px`,
                  }}
                  aria-label="Admin Settings"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              )}
            </>
          }
        />
      ) : (
        <div className="flex items-center justify-between mb-6 px-6">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="Search items"
              title="Search items (Press '/' or Ctrl+K)"
            >
              <Search className="h-5 w-5" />
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                aria-label="Admin Settings"
                title="Admin Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Search Items</DialogTitle>
          </DialogHeader>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search items... (Press '/' to open)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 pr-3 h-12 text-base"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchValue('');
                  setSearchOpen(false);
                }
              }}
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchValue('')}
              >
                ×
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Settings dialog - Admin controls are shown in MenuList when settingsOpen is true */}
      <div className="bg-background min-h-screen">
        <POSContainer 
          searchTerm={searchValue} 
          setSearchTerm={setSearchValue}
          showAdminControls={settingsOpen}
          onToggleAdminControls={() => setSettingsOpen(!settingsOpen)}
        />
      </div>
    </>
  );
};

export default POS;
