const test = `
it('should clear buffer after successful flush', async () => {
    // Arrange: Buffer events (includes initial events)
    const initialBufferLength = bridge.getConsentBufferLength();
    bridge.event('view_product', { productId: '123' });
    expect(bridge.getConsentBufferLength()).toBe(initialBufferLength + 1);

    // Act: Grant consent and wait for flush
    await bridge.setConsent('custom', true);
    await wait(500);

    // Assert: Buffer cleared
    expect(bridge.getConsentBufferLength()).toBe(0);

    // Assert: New events go directly to queue (not buffered)
    console.log('Before event call - Queue length:', bridge.getQueueLength());
    console.log('Before event call - Buffer length:', bridge.getConsentBufferLength());
    console.log('Before event call - Consent state:', bridge.getConsentState());
    
    bridge.event('purchase', { orderId: '456' });
    
    console.log('After event call - Queue length:', bridge.getQueueLength());
    console.log('After event call - Buffer length:', bridge.getConsentBufferLength());
    
    // Maybe the event was sent immediately? Check fetch calls
    console.log('Fetch call count:', mockFetch.mock.calls.length);
    
    expect(bridge.getQueueLength()).toBeGreaterThan(0);
    expect(bridge.getConsentBufferLength()).toBe(0);
  });
`;
console.log('Debug test modification suggestion');
