import React from 'react';

const UserInfoDisplay = ({ userData, qrType }) => {
  if (!userData) return null;

  const renderUserInfo = () => {
    if (qrType === 'userInfo' && userData.nom) {
      return (
        <div className="space-y-2">
          <h4 className="font-semibold text-blue-600">Informations de l'utilisateur</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Nom :</strong> {userData.nom}</div>
            <div><strong>Matricule :</strong> {userData.matricule}</div>
            <div><strong>Poste :</strong> {userData.poste}</div>
            <div><strong>Entreprise :</strong> {userData.entreprise}</div>
            {userData.email && <div><strong>Email :</strong> {userData.email}</div>}
            {userData.telephone && <div><strong>Téléphone :</strong> {userData.telephone}</div>}
            {userData.departement && <div><strong>Département :</strong> {userData.departement}</div>}
            {userData.dateEmbauche && <div><strong>Date d'embauche :</strong> {userData.dateEmbauche}</div>}
            <div><strong>Statut :</strong> {userData.statut}</div>
          </div>
        </div>
      );
    }

    if (qrType === 'vCard') {
      return (
        <div className="space-y-2">
          <h4 className="font-semibold text-green-600">Carte de contact (vCard)</h4>
          <p className="text-sm text-gray-600">
            Ce QR code contient une carte de contact qui peut être ajoutée directement 
            aux contacts de votre téléphone.
          </p>
        </div>
      );
    }

    if (qrType === 'url') {
      return (
        <div className="space-y-2">
          <h4 className="font-semibold text-purple-600">URL simple</h4>
          <p className="text-sm text-gray-600">
            Ce QR code renvoie vers une URL simple pour accéder aux informations de l'employé.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-600">Données détectées</h4>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(userData, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      {renderUserInfo()}
    </div>
  );
};

export default UserInfoDisplay; 