# Usage Examples

This document provides practical examples for implementing the TraceLog client in various scenarios and frameworks.

## Table of Contents

- [Basic Setup](#basic-setup)
- [Framework Integration](#framework-integration)
- [Common Use Cases](#common-use-cases)
- [E-commerce Tracking](#e-commerce-tracking)
- [Form Analytics](#form-analytics)
- [Content Engagement](#content-engagement)
- [Performance Monitoring](#performance-monitoring)
- [Advanced Patterns](#advanced-patterns)

## Basic Setup

### Simple Implementation

```javascript
import { startTracking, sendCustomEvent } from '@tracelog/client';

// Initialize tracking
startTracking('your-app-id');

// Track user actions
document.getElementById('signup-btn').addEventListener('click', () => {
  sendCustomEvent('signup_button_clicked', {
    location: 'hero_section',
    variant: 'primary'
  });
});
```

### With Configuration

```javascript
import { startTracking, sendCustomEvent } from '@tracelog/client';

startTracking('your-app-id', {
  sessionTimeout: 1800000, // 30 minutes
  globalMetadata: {
    app_version: '2.1.0',
    environment: 'production',
    user_segment: 'premium'
  },
  scrollContainerSelectors: ['.main-content', '.sidebar']
});
```

## Framework Integration

### React

```jsx
// hooks/useTracking.js
import { useEffect } from 'react';
import { startTracking, sendCustomEvent } from '@tracelog/client';

export const useTracking = (userId) => {
  useEffect(() => {
    startTracking('your-app-id', {
      globalMetadata: {
        userId: userId,
        timestamp: Date.now()
      }
    });
  }, [userId]);

  const trackEvent = (eventName, metadata = {}) => {
    sendCustomEvent(eventName, {
      ...metadata,
      component: 'react'
    });
  };

  return { trackEvent };
};

// components/Button.jsx
import React from 'react';
import { useTracking } from '../hooks/useTracking';

const Button = ({ children, onClick, trackingData = {} }) => {
  const { trackEvent } = useTracking();

  const handleClick = (e) => {
    trackEvent('button_clicked', {
      buttonText: children,
      ...trackingData
    });
    onClick?.(e);
  };

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
};

// App.jsx
import React, { useEffect } from 'react';
import { useTracking } from './hooks/useTracking';

function App() {
  const { trackEvent } = useTracking('user-123');

  useEffect(() => {
    trackEvent('app_mounted');
  }, []);

  return (
    <div>
      <Button 
        trackingData={{ section: 'hero', priority: 'high' }}
        onClick={() => console.log('Clicked!')}
      >
        Get Started
      </Button>
    </div>
  );
}
```

### Vue.js

```javascript
// plugins/tracking.js
import { startTracking, sendCustomEvent } from '@tracelog/client';

export default {
  install(app, options) {
    startTracking(options.trackingId, options.config);

    app.config.globalProperties.$track = (eventName, metadata) => {
      sendCustomEvent(eventName, metadata);
    };

    app.provide('track', (eventName, metadata) => {
      sendCustomEvent(eventName, metadata);
    });
  }
};

// main.js
import { createApp } from 'vue';
import App from './App.vue';
import trackingPlugin from './plugins/tracking';

const app = createApp(App);

app.use(trackingPlugin, {
  trackingId: 'your-app-id',
  config: {
    globalMetadata: {
      framework: 'vue',
      version: '3.0'
    }
  }
});

app.mount('#app');

// Component usage
<template>
  <button @click="handleClick">
    Click me
  </button>
</template>

<script>
import { inject } from 'vue';

export default {
  setup() {
    const track = inject('track');

    const handleClick = () => {
      track('button_clicked', {
        component: 'ExampleComponent',
        action: 'user_interaction'
      });
    };

    return { handleClick };
  }
};
</script>
```

### Angular

```typescript
// services/tracking.service.ts
import { Injectable } from '@angular/core';
import { startTracking, sendCustomEvent } from '@tracelog/client';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private initialized = false;

  initialize(trackingId: string, config = {}) {
    if (!this.initialized) {
      startTracking(trackingId, config);
      this.initialized = true;
    }
  }

  track(eventName: string, metadata: Record<string, any> = {}) {
    sendCustomEvent(eventName, {
      ...metadata,
      framework: 'angular',
      timestamp: Date.now()
    });
  }
}

// app.component.ts
import { Component, OnInit } from '@angular/core';
import { TrackingService } from './services/tracking.service';

@Component({
  selector: 'app-root',
  template: `
    <button (click)="onButtonClick()" 
            [attr.data-track]="'main-cta'">
      Get Started
    </button>
  `
})
export class AppComponent implements OnInit {
  constructor(private tracking: TrackingService) {}

  ngOnInit() {
    this.tracking.initialize('your-app-id', {
      globalMetadata: {
        framework: 'angular',
        version: '15.0'
      }
    });
  }

  onButtonClick() {
    this.tracking.track('cta_clicked', {
      section: 'hero',
      action: 'get_started'
    });
  }
}
```

## Common Use Cases

### User Authentication Tracking

```javascript
// Auth tracking
class AuthTracker {
  static trackLogin(method, success, userId = null) {
    sendCustomEvent('user_login_attempt', {
      method: method, // 'email', 'google', 'facebook'
      success: success,
      userId: success ? userId : null,
      timestamp: Date.now()
    });
  }

  static trackLogout(userId) {
    sendCustomEvent('user_logout', {
      userId: userId,
      sessionDuration: this.getSessionDuration(),
      timestamp: Date.now()
    });
  }

  static trackRegistration(method, success, errors = []) {
    sendCustomEvent('user_registration', {
      method: method,
      success: success,
      errors: errors,
      timestamp: Date.now()
    });
  }

  static getSessionDuration() {
    // Calculate session duration logic
    return Date.now() - (window.sessionStartTime || Date.now());
  }
}

// Usage
AuthTracker.trackLogin('email', true, 'user-123');
AuthTracker.trackRegistration('google', false, ['email_exists']);
```

### Navigation Tracking

```javascript
// Navigation tracker for SPAs
class NavigationTracker {
  constructor() {
    this.startTime = Date.now();
    this.setupRouteTracking();
  }

  setupRouteTracking() {
    // For React Router, Vue Router, etc.
    window.addEventListener('popstate', this.trackPageView.bind(this));
    
    // Override pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.trackPageView();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.trackPageView();
    };
  }

  trackPageView() {
    const timeOnPage = Date.now() - this.startTime;
    
    sendCustomEvent('page_view', {
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
      timeOnPreviousPage: timeOnPage,
      timestamp: Date.now()
    });

    this.startTime = Date.now();
  }
}

// Initialize
new NavigationTracker();
```

## E-commerce Tracking

### Product Interactions

```javascript
class EcommerceTracker {
  // Product viewing
  static trackProductView(product) {
    sendCustomEvent('product_viewed', {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      currency: product.currency,
      inStock: product.inStock,
      brand: product.brand,
      sku: product.sku
    });
  }

  // Add to cart
  static trackAddToCart(product, quantity = 1) {
    sendCustomEvent('product_added_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: quantity,
      totalValue: product.price * quantity,
      cartSize: this.getCartSize() + quantity
    });
  }

  // Purchase tracking
  static trackPurchase(order) {
    sendCustomEvent('purchase_completed', {
      orderId: order.id,
      totalValue: order.total,
      currency: order.currency,
      itemCount: order.items.length,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      discountAmount: order.discount || 0,
      taxAmount: order.tax || 0,
      items: order.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    });
  }

  // Search tracking
  static trackSearch(query, resultsCount, filters = {}) {
    sendCustomEvent('search_performed', {
      query: query,
      resultsCount: resultsCount,
      filters: filters,
      timestamp: Date.now()
    });
  }

  static getCartSize() {
    // Implementation depends on your cart system
    return parseInt(localStorage.getItem('cartSize') || '0');
  }
}

// Usage examples
EcommerceTracker.trackProductView({
  id: 'prod-123',
  name: 'Wireless Headphones',
  category: 'Electronics',
  price: 99.99,
  currency: 'USD',
  inStock: true,
  brand: 'AudioTech'
});

EcommerceTracker.trackSearch('wireless headphones', 24, {
  priceRange: '50-150',
  brand: 'AudioTech',
  rating: '4+'
});
```

## Form Analytics

### Form Interaction Tracking

```javascript
class FormTracker {
  constructor(formElement, formName) {
    this.form = formElement;
    this.formName = formName;
    this.startTime = Date.now();
    this.fieldInteractions = {};
    this.errors = [];
    
    this.setupFormTracking();
  }

  setupFormTracking() {
    // Track form start
    sendCustomEvent('form_started', {
      formName: this.formName,
      fieldCount: this.form.elements.length,
      timestamp: Date.now()
    });

    // Track field interactions
    Array.from(this.form.elements).forEach(field => {
      if (field.type !== 'submit' && field.type !== 'button') {
        this.trackFieldEvents(field);
      }
    });

    // Track form submission
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  trackFieldEvents(field) {
    const fieldName = field.name || field.id;
    
    field.addEventListener('focus', () => {
      this.fieldInteractions[fieldName] = {
        ...this.fieldInteractions[fieldName],
        focused: true,
        focusTime: Date.now()
      };
    });

    field.addEventListener('blur', () => {
      const interaction = this.fieldInteractions[fieldName];
      if (interaction && interaction.focusTime) {
        interaction.timeSpent = Date.now() - interaction.focusTime;
        interaction.completed = field.value.length > 0;
      }
    });

    field.addEventListener('input', () => {
      if (!this.fieldInteractions[fieldName]) {
        this.fieldInteractions[fieldName] = {};
      }
      this.fieldInteractions[fieldName].modified = true;
    });
  }

  trackValidationError(fieldName, errorMessage) {
    this.errors.push({
      field: fieldName,
      message: errorMessage,
      timestamp: Date.now()
    });

    sendCustomEvent('form_validation_error', {
      formName: this.formName,
      fieldName: fieldName,
      errorMessage: errorMessage
    });
  }

  handleSubmit(event) {
    const completionTime = Date.now() - this.startTime;
    const completedFields = Object.keys(this.fieldInteractions)
      .filter(field => this.fieldInteractions[field].completed).length;

    sendCustomEvent('form_submitted', {
      formName: this.formName,
      completionTime: completionTime,
      totalFields: this.form.elements.length,
      completedFields: completedFields,
      fieldInteractions: this.fieldInteractions,
      errorCount: this.errors.length,
      errors: this.errors,
      success: this.errors.length === 0
    });
  }
}

// Usage
const contactForm = document.getElementById('contact-form');
const tracker = new FormTracker(contactForm, 'contact_form');

// Track validation errors
function validateEmail(field) {
  if (!field.value.includes('@')) {
    tracker.trackValidationError('email', 'Invalid email format');
    return false;
  }
  return true;
}
```

## Content Engagement

### Reading and Scroll Tracking

```javascript
class ContentTracker {
  constructor(articleElement) {
    this.article = articleElement;
    this.articleId = articleElement.dataset.articleId;
    this.startTime = Date.now();
    this.maxScroll = 0;
    this.milestones = [25, 50, 75, 90, 100];
    this.achievedMilestones = new Set();
    
    this.setupScrollTracking();
    this.setupEngagementTracking();
  }

  setupScrollTracking() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const scrollPercentage = Math.round(
            (entry.intersectionRatio * 100)
          );
          
          this.maxScroll = Math.max(this.maxScroll, scrollPercentage);
          this.checkMilestones(scrollPercentage);
        }
      });
    }, {
      threshold: Array.from({length: 101}, (_, i) => i / 100)
    });

    observer.observe(this.article);
  }

  checkMilestones(scrollPercentage) {
    this.milestones.forEach(milestone => {
      if (scrollPercentage >= milestone && 
          !this.achievedMilestones.has(milestone)) {
        
        this.achievedMilestones.add(milestone);
        
        sendCustomEvent('content_milestone_reached', {
          articleId: this.articleId,
          milestone: milestone,
          timeToReach: Date.now() - this.startTime,
          timestamp: Date.now()
        });
      }
    });
  }

  setupEngagementTracking() {
    // Track when user becomes inactive
    let activeTime = 0;
    let lastActiveTime = Date.now();
    let isActive = true;

    const trackActivity = () => {
      if (isActive) {
        activeTime += Date.now() - lastActiveTime;
      }
      lastActiveTime = Date.now();
      isActive = true;
    };

    const trackInactivity = () => {
      isActive = false;
    };

    // Activity events
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
      .forEach(event => {
        document.addEventListener(event, trackActivity, true);
      });

    // Track when user leaves
    window.addEventListener('beforeunload', () => {
      this.trackArticleExit(activeTime);
    });

    // Periodic activity check
    setInterval(trackInactivity, 5000);
  }

  trackArticleExit(activeTime) {
    const totalTime = Date.now() - this.startTime;
    
    sendCustomEvent('article_exit', {
      articleId: this.articleId,
      maxScrollPercentage: this.maxScroll,
      totalTime: totalTime,
      activeTime: activeTime,
      engagementRatio: activeTime / totalTime,
      milestonesReached: Array.from(this.achievedMilestones),
      completedReading: this.maxScroll >= 90
    });
  }
}

// Usage
document.querySelectorAll('[data-article-id]').forEach(article => {
  new ContentTracker(article);
});
```

## Performance Monitoring

### Performance and Error Tracking

```javascript
class PerformanceTracker {
  static trackPageLoad() {
    window.addEventListener('load', () => {
      // Wait a bit for all resources to load
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        sendCustomEvent('page_performance', {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
          transferSize: navigation.transferSize,
          encodedBodySize: navigation.encodedBodySize,
          decodedBodySize: navigation.decodedBodySize
        });
      }, 1000);
    });
  }

  static trackResourceErrors() {
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        sendCustomEvent('resource_error', {
          type: 'resource',
          source: event.target.src || event.target.href,
          tagName: event.target.tagName,
          message: event.message || 'Resource failed to load'
        });
      }
    }, true);
  }

  static trackJavaScriptErrors() {
    window.addEventListener('error', (event) => {
      sendCustomEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        userAgent: navigator.userAgent
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      sendCustomEvent('promise_rejection', {
        reason: event.reason?.toString() || 'Unhandled promise rejection',
        stack: event.reason?.stack
      });
    });
  }

  static trackWebVitals() {
    // Web Vitals tracking (requires web-vitals library)
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(metric => this.sendWebVital('CLS', metric));
      getFID(metric => this.sendWebVital('FID', metric));
      getFCP(metric => this.sendWebVital('FCP', metric));
      getLCP(metric => this.sendWebVital('LCP', metric));
      getTTFB(metric => this.sendWebVital('TTFB', metric));
    });
  }

  static sendWebVital(name, metric) {
    sendCustomEvent('web_vital', {
      name: name,
      value: metric.value,
      rating: this.getVitalRating(name, metric.value),
      delta: metric.delta,
      id: metric.id
    });
  }

  static getVitalRating(name, value) {
    const thresholds = {
      'CLS': [0.1, 0.25],
      'FID': [100, 300],
      'LCP': [2500, 4000],
      'FCP': [1800, 3000],
      'TTFB': [800, 1800]
    };

    const [good, poor] = thresholds[name] || [0, 0];
    
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }
}

// Initialize performance tracking
PerformanceTracker.trackPageLoad();
PerformanceTracker.trackResourceErrors();
PerformanceTracker.trackJavaScriptErrors();
PerformanceTracker.trackWebVitals();
```

## Advanced Patterns

### Custom Event Dispatcher

```javascript
class TrackingEventDispatcher {
  constructor() {
    this.listeners = new Map();
    this.middleware = [];
  }

  // Add middleware for processing events before sending
  use(middleware) {
    this.middleware.push(middleware);
  }

  // Listen for specific tracking events
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  // Dispatch event through middleware and listeners
  async dispatch(eventName, data) {
    let processedData = { ...data };

    // Apply middleware
    for (const middleware of this.middleware) {
      processedData = await middleware(eventName, processedData) || processedData;
    }

    // Send to TraceLog
    sendCustomEvent(eventName, processedData);

    // Notify listeners
    const listeners = this.listeners.get(eventName) || [];
    listeners.forEach(callback => callback(processedData));
  }
}

// Usage
const tracker = new TrackingEventDispatcher();

// Add data enrichment middleware
tracker.use(async (eventName, data) => {
  return {
    ...data,
    timestamp: Date.now(),
    sessionId: await getSessionId(),
    userId: getCurrentUserId()
  };
});

// Add validation middleware
tracker.use((eventName, data) => {
  if (!eventName || typeof eventName !== 'string') {
    console.warn('Invalid event name:', eventName);
    return null; // Cancel event
  }
  return data;
});

// Listen for specific events
tracker.on('purchase_completed', (data) => {
  console.log('Purchase tracked:', data);
  // Send to other analytics services
});

// Dispatch events
tracker.dispatch('button_clicked', {
  buttonId: 'subscribe',
  section: 'header'
});
```

### A/B Testing Integration

```javascript
class ABTestTracker {
  constructor(experiments = {}) {
    this.experiments = experiments;
    this.userVariants = this.assignVariants();
    this.trackExperimentExposure();
  }

  assignVariants() {
    const variants = {};
    
    Object.keys(this.experiments).forEach(experimentName => {
      const experiment = this.experiments[experimentName];
      const userId = this.getUserId();
      const hash = this.hashUserId(userId + experimentName);
      const variantIndex = Math.floor(hash * experiment.variants.length);
      
      variants[experimentName] = experiment.variants[variantIndex];
    });

    return variants;
  }

  trackExperimentExposure() {
    Object.keys(this.userVariants).forEach(experimentName => {
      sendCustomEvent('experiment_exposure', {
        experimentName: experimentName,
        variant: this.userVariants[experimentName],
        userId: this.getUserId()
      });
    });
  }

  trackConversion(experimentName, conversionType, value = null) {
    const variant = this.userVariants[experimentName];
    
    if (variant) {
      sendCustomEvent('experiment_conversion', {
        experimentName: experimentName,
        variant: variant,
        conversionType: conversionType,
        value: value,
        userId: this.getUserId()
      });
    }
  }

  getVariant(experimentName) {
    return this.userVariants[experimentName] || 'control';
  }

  hashUserId(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  getUserId() {
    return localStorage.getItem('userId') || 'anonymous';
  }
}

// Usage
const abTester = new ABTestTracker({
  'checkout_button_color': {
    variants: ['blue', 'green', 'red']
  },
  'pricing_display': {
    variants: ['monthly', 'annual', 'lifetime']
  }
});

// Use variant in your app
const buttonColor = abTester.getVariant('checkout_button_color');
document.getElementById('checkout-btn').style.backgroundColor = buttonColor;

// Track conversions
document.getElementById('checkout-btn').addEventListener('click', () => {
  abTester.trackConversion('checkout_button_color', 'button_click');
});

// Track final conversion
function onPurchaseComplete() {
  abTester.trackConversion('checkout_button_color', 'purchase', 99.99);
  abTester.trackConversion('pricing_display', 'purchase', 99.99);
}
```

These examples demonstrate the flexibility and power of the TraceLog client across various use cases and implementations. Choose the patterns that best fit your application's needs and customize them accordingly. 