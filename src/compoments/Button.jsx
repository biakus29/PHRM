// src/components/Button.jsx
import styled from "styled-components";

const StyledButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background: ${({ variant }) =>
    variant === "danger" ? "#ef4444" : variant === "secondary" ? "#6b7280" : variant === "ghost" ? "transparent" : "#3b82f6"};
  color: ${({ variant }) => (variant === "ghost" ? "#4b5563" : "white")};
  font-weight: 500;
  &:hover {
    background: ${({ variant }) =>
      variant === "danger" ? "#dc2626" : variant === "secondary" ? "#4b5563" : variant === "ghost" ? "#f3f4f6" : "#2563eb"};
  }
  &:focus {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
`;

const Button = ({ children, icon: Icon, variant, className, ...props }) => (
  <StyledButton variant={variant} className={className} {...props}>
    {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
    {children}
  </StyledButton>
);

export default Button;