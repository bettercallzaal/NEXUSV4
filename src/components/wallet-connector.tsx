"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface WalletConnectorProps {
  onWalletConnected: (address: string) => void;
  onWalletDisconnected: () => void;
}

export function WalletConnector({ onWalletConnected, onWalletDisconnected }: WalletConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if already connected on initial load
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const checkConnection = async () => {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          const address = accounts[0];
          setWalletAddress(address);
          onWalletConnected(address);
        }
      } catch (error) {
        console.error("[WALLET] Error checking connection:", error);
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setWalletAddress(null);
        onWalletDisconnected();
      } else {
        // User switched accounts
        const address = accounts[0];
        setWalletAddress(address);
        onWalletConnected(address);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [onWalletConnected, onWalletDisconnected]);

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      
      console.log("[WALLET] Connected with address:", address);
      setWalletAddress(address);
      onWalletConnected(address);
    } catch (error) {
      console.error("[WALLET] Error connecting wallet:", error);
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet (for UI purposes only, doesn't actually disconnect MetaMask)
  const disconnectWallet = () => {
    setWalletAddress(null);
    onWalletDisconnected();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-2 rounded text-sm">
          {error}
        </div>
      )}

      {walletAddress ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm">
            Connected: <span className="font-mono">{`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
          </p>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={disconnectWallet}
          >
            Disconnect Wallet
          </Button>
        </div>
      ) : (
        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          className="flex items-center gap-2"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect Wallet"
          )}
        </Button>
      )}
    </div>
  );
}
