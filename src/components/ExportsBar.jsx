import React, { memo } from "react";
import Button from "../compoments/Button";
import { Download } from "lucide-react";

const ExportsBar = ({ onPdf, onXlsx, onCsv, disabled }) => {
  return (
    <div className="flex gap-4">
      <Button onClick={onPdf} icon={Download} className="bg-green-600 hover:bg-green-700 text-white" disabled={disabled}>
        Exporter PDF
      </Button>
      <Button onClick={onXlsx} icon={Download} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={disabled}>
        Exporter Excel
      </Button>
      <Button onClick={onCsv} icon={Download} className="bg-purple-600 hover:bg-purple-700 text-white" disabled={disabled}>
        Exporter CSV
      </Button>
    </div>
  );
};

export default memo(ExportsBar);
