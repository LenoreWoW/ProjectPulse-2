import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    
    interface ElementClass {
      render?: any;
    }
    
    interface ElementAttributesProperty {
      props?: any;
    }
    
    interface ElementChildrenAttribute {
      children?: any;
    }
  }
} 