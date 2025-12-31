
'use client';
import React, { useEffect } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

// This component ensures the @google/model-viewer custom element is defined.
const ModelViewer = React.forwardRef<any, any>((props, ref) => {
  useEffect(() => {
    // This will run on the client and define the custom element.
    import('@google/model-viewer');
  }, []);

  return React.createElement('model-viewer', { ref, ...props });
});

ModelViewer.displayName = 'ModelViewer';

export default ModelViewer;
