import React, { DragEvent } from 'react';
import { Badge } from 'antd';

interface KanbanColumnProps {
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  color,
  count,
  children,
  onDragOver,
  onDrop,
}) => {
  // Converter cor de background para border (ex: 'bg-orange-800' -> 'border-orange-800')
  const borderColor = color.replace('bg-', 'border-');

  return (
    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col">
      {/* Cabeçalho da coluna */}
      <div className={`flex items-center justify-between mb-4 border-l-4 pl-2 ${borderColor}`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${color}`}></div>
          <h3 className="font-semibold text-text-primary dark:text-slate-100">{title}</h3>
        </div>
        <Badge count={count} style={{ backgroundColor: '#1e40af' }} />
      </div>

      {/* Área de conteúdo (cards) - área de drop */}
      <div 
        className="flex-1 overflow-y-auto pr-1"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {children}
      </div>
    </div>
  );
};

export default KanbanColumn;
