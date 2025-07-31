// src/components/EmployeeCard.jsx
import React from "react";
import styled from "styled-components";
import { FiEdit, FiTrash, FiCalendar, FiUpload, FiFileText, FiFile } from "react-icons/fi";
import PropTypes from "prop-types";
import { displayDepartment, displayMatricule, displayPhone, displayGeneratedAt } from "../utils/displayUtils";

const EmployeeCard = ({
  employee,
  onEdit,
  onDelete,
  onRequestLeave,
  onUploadPaySlip,
  onCreatePaySlip,
  onManageContract,
  animationDelay,
}) => {
  if (!employee) {
    return (
      <StyledWrapper style={{ animationDelay }}>
        <div className="card">
          <div className="bg uwu" />
          <div className="bg" />
          <div className="content">
            <p className="text-red-400 text-center">Employé non défini</p>
          </div>
        </div>
      </StyledWrapper>
    );
  }

  const {
    name = "Nom non défini",
    poste = "Non spécifié",
    role = "Non spécifié",
    email = "Email non défini",
    leaves = { balance: 0 },
    payslips = [],
    contract = null,
    profilePicture = null,
  } = employee;

  return (
    <StyledWrapper style={{ animationDelay }}>
      <div className="card">
        <div className="bg uwu" />
        <div className="bg" />
        <div className="content">
          <div className="img">
            <img
              src={
                profilePicture ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B82F6&color=fff`
              }
              alt={name}
              className="w-full h-full rounded-lg object-cover"
              onError={() => console.error(`[EmployeeCard] Erreur chargement photo pour ${name}`)}
            />
          </div>
          <div className="h1">{name}</div>
          <div className="p">
            {poste} - {role}
            <p>
              Email: {email} <br />
              Téléphone: {displayPhone(employee.phone)} <br />
              Département: {displayDepartment(employee.department)} <br />
              Matricule: {displayMatricule(employee.matricule)} <br />
              Solde Congés: {leaves.balance} jours <br />
              Dernière Fiche:{" "}
              {payslips.length > 0 && payslips[0]?.date
                ? displayGeneratedAt(payslips[0].date)
                : "Aucune"}{" "}
              <br />
              Contrat:{" "}
              {contract?.generatedAt
                ? `Généré le ${displayGeneratedAt(contract.generatedAt)}`
                : "Aucun"}
            </p>
          </div>
          <div className="actions">
            <button
              onClick={() => onEdit(employee)}
              className="action-btn edit"
              aria-label={`Modifier ${name}`}
            >
              <FiEdit className="icon" /> Modifier
            </button>
            <button
              onClick={() => onDelete(employee.id)}
              className="action-btn delete"
              aria-label={`Supprimer ${name}`}
            >
              <FiTrash className="icon" /> Supprimer
            </button>
            <button
              onClick={() => onRequestLeave(employee.id)}
              className="action-btn leave"
              aria-label="Demander un congé"
            >
              <FiCalendar className="icon" /> Congé
            </button>
            <button
              onClick={() => onCreatePaySlip(employee)}
              className="action-btn payslip"
              aria-label={`Créer une fiche de paie pour ${name}`}
            >
              <FiFileText className="icon" /> Créer Fiche
            </button>
            <button
              onClick={() => onManageContract(employee)}
              className="action-btn contract"
              aria-label={contract ? `Modifier le contrat de ${name}` : `Créer un contrat pour ${name}`}
            >
              <FiFile className="icon" /> {contract ? "Modifier Contrat" : "Créer Contrat"}
            </button>
            <label
              htmlFor={`payslip-${employee.id}`}
              className="action-btn upload"
              aria-label="Uploader une fiche de paie"
            >
              <input
                type="file"
                id={`payslip-${employee.id}`}
                onChange={(e) => onUploadPaySlip(e, employee.id)}
                className="hidden-input"
                accept=".pdf,.doc,.docx"
              />
              <FiUpload className="icon" /> Uploader
            </label>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

EmployeeCard.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    poste: PropTypes.string,
    role: PropTypes.string,
    email: PropTypes.string,
    leaves: PropTypes.shape({
      balance: PropTypes.number,
    }),
    payslips: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string,
      })
    ),
    contract: PropTypes.shape({
      generatedAt: PropTypes.string,
    }),
    profilePicture: PropTypes.string,
  }),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRequestLeave: PropTypes.func.isRequired,
  onUploadPaySlip: PropTypes.func.isRequired,
  onCreatePaySlip: PropTypes.func.isRequired,
  onManageContract: PropTypes.func.isRequired,
  animationDelay: PropTypes.string,
};

EmployeeCard.defaultProps = {
  employee: null,
  animationDelay: "0s",
};

const StyledWrapper = styled.div`
  .card {
    position: relative;
    width: 190px;
    color: white;
    height: 360px;
    background: #444;
    border-radius: 14px;
  }

  .bg {
    position: absolute;
    z-index: -1;
    inset: -4px;
    border-radius: 16px;
    overflow: hidden;
  }

  .uwu {
    filter: blur(8px);
    transition: filter 0.3s;
  }

  .bg::before {
    content: "";
    position: absolute;
    aspect-ratio: 1/1;
    top: 50%;
    left: 50%;
    min-width: 150%;
    min-height: 150%;
    background-image: conic-gradient(
      hsl(0, 100%, 50%),
      hsl(30, 100%, 50%),
      hsl(60, 100%, 50%),
      hsl(90, 100%, 50%),
      hsl(120, 100%, 50%),
      hsl(150, 100%, 50%),
      hsl(180, 100%, 50%),
      hsl(210, 100%, 50%),
      hsl(240, 100%, 60%),
      hsl(270, 100%, 50%),
      hsl(300, 100%, 50%),
      hsl(330, 100%, 50%),
      hsl(360, 100%, 50%)
    );
    animation: speeen 4s linear infinite;
    transform-origin: 0% 0%;
    transform: rotate(0deg) translate(-50%, -50%);
  }

  @keyframes speeen {
    from {
      transform: rotate(0deg) translate(-50%, -50%);
    }
    to {
      transform: rotate(360deg) translate(-50%, -50%);
    }
  }

  .content {
    position: relative;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .img {
    height: 5em;
    width: 5em;
    margin: auto;
    background-color: #fff3;
    border-radius: 1em;
    overflow: hidden;
  }

  .img img {
    height: 100%;
    width: 100%;
    object-fit: cover;
  }

  .content div {
    text-align: center;
  }

  .h1 {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-size: 1em;
    font-weight: 600;
  }

  .p {
    font-size: 0.75em;
    flex-grow: 1;
  }

  .p p {
    margin-top: 0.5em;
    padding: 0.5em;
    background-color: #0003;
    border-radius: 1em;
  }

  .actions {
    margin-top: 1em;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
    justify-content: center;
  }

  .action-btn {
    padding: 0.3em 0.6em;
    font-size: 0.7em;
    color: white;
    border: none;
    border-radius: 0.5em;
    cursor: pointer;
    transition: background-color 0.3s;
    display: flex;
    align-items: center;
    gap: 0.3em;
  }

  .icon {
    width: 1em;
    height: 1em;
  }

  .edit {
    background-color: #f59e0b; /* Jaune */
  }

  .edit:hover {
    background-color: #d97706;
  }

  .delete {
    background-color: #ef4444; /* Rouge */
  }

  .delete:hover {
    background-color: #dc2626;
  }

  .leave {
    background-color: #10b981; /* Vert */
  }

  .leave:hover {
    background-color: #059669;
  }

  .payslip {
    background-color: #3b82f6; /* Bleu */
  }

  .payslip:hover {
    background-color: #2563eb;
  }

  .contract {
    background-color: #6b7280; /* Gris */
  }

  .contract:hover {
    background-color: #4b5563;
  }

  .upload {
    background-color: #8b5cf6; /* Violet */
  }

  .upload:hover {
    background-color: #7c3aed;
  }

  .hidden-input {
    display: none;
  }
`;

export default EmployeeCard;