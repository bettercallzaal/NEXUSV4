"use client";

import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function WalletConnect() {
  const { 
    formattedAddress, 
    isConnected, 
    isConnecting, 
    zaoBalance, 
    loanzBalance, 
    error, 
    connect, 
    disconnect 
  } = useWallet();

  return (
    <div className="flex items-center gap-2">
      {isConnected && (Number(zaoBalance) > 0 || Number(loanzBalance) > 0) && (
        <div className="hidden md:flex items-center gap-2 text-sm">
          {Number(zaoBalance) > 0 && (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-md">
              <span className="font-medium">{zaoBalance}</span> ZAO
            </div>
          )}
          {Number(loanzBalance) > 0 && (
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md">
              <span className="font-medium">{loanzBalance}</span> LOANZ
            </div>
          )}
        </div>
      )}
      
      {!isConnected ? (
        <Button 
          onClick={connect} 
          disabled={isConnecting}
          variant="outline"
          size="sm"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting
            </>
          ) : (
            "Connect Wallet"
          )}
        </Button>
      ) : (
        <Button 
          onClick={disconnect}
          variant="outline"
          size="sm"
        >
          {formattedAddress || "Disconnect"}
        </Button>
      )}
    </div>
  );
}
