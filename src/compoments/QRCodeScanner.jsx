import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { decodeQRCodeData, validateQRCodeData } from '../utils/qrCodeUtils';
import { toast } from 'react-toastify';
import UserInfoDisplay from './UserInfoDisplay';

const QRCodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [decodedData, setDecodedData] = useState(null);
  const [qrType, setQrType] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scanner.render((decodedText) => {
        setScanning(false);
        setResult(decodedText);
        
        // Décoder les données du QR code
        const decoded = decodeQRCodeData(decodedText);
        setDecodedData(decoded);
        
        // Déterminer le type de QR code
        if (decoded && decoded.nom) {
          setQrType('userInfo');
        } else if (decoded && decoded.type === 'vCard') {
          setQrType('vCard');
        } else if (decoded && decoded.type === 'url') {
          setQrType('url');
        } else if (decoded && decoded.type === 'employee_badge') {
          setQrType('employee_badge');
        } else {
          setQrType('unknown');
        }
        
        if (decoded && validateQRCodeData(decoded)) {
          toast.success('QR Code scanné avec succès !');
          if (onScan) {
            onScan(decoded);
          }
        } else {
          toast.error('QR Code invalide ou format non reconnu');
        }
        
        // Nettoyer le scanner
        scanner.clear();
        scannerRef.current = null;
      }, (error) => {
        console.error('Erreur lors du scan:', error);
      });

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [scanning, onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Scanner QR Code</h3>
        
        {!scanning ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Cliquez sur "Démarrer" pour scanner un QR code
            </p>
            <button
              onClick={() => setScanning(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Démarrer le scan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div id="qr-reader" className="w-full"></div>
            <button
              onClick={() => {
                setScanning(false);
                if (scannerRef.current) {
                  scannerRef.current.clear();
                  scannerRef.current = null;
                }
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Arrêter le scan
            </button>
          </div>
        )}
        
        {decodedData && (
          <div className="mt-4">
            <UserInfoDisplay userData={decodedData} qrType={qrType} />
          </div>
        )}
        
        <button
          onClick={onClose}
          className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default QRCodeScanner; 