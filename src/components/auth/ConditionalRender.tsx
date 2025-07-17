import React from 'react';

interface ConditionalRenderProps {
  show: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  show,
  children,
  fallback = null
}) => {
  return show ? <>{children}</> : <>{fallback}</>;
};

export default ConditionalRender;
