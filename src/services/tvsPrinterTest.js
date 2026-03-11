import { NativeModules, ToastAndroid } from 'react-native';

const { TVSPrinter } = NativeModules;

export const testTVSPrinter = async () => {
  try {
    console.log('=== TVS PRINTER TEST ===');
    
    if (!TVSPrinter) {
      console.log('❌ TVSPrinter module not found');
      ToastAndroid.show('❌ TVSPrinter module not found', ToastAndroid.LONG);
      return false;
    }
    
    console.log('✅ TVSPrinter module found');
    ToastAndroid.show('✅ TVSPrinter module found', ToastAndroid.SHORT);
    
    // Check printer status
    try {
      const status = await TVSPrinter.checkPrinterStatus();
      console.log('Printer status:', status);
      ToastAndroid.show(`Printer status: ${status}`, ToastAndroid.LONG);
      
      // If not initialized, try to reinitialize
      if (status.includes('Not initialized') || status.includes('Error')) {
        console.log('🔄 Attempting reinitialization...');
        ToastAndroid.show('🔄 Reinitializing...', ToastAndroid.SHORT);
        
        try {
          const reinitResult = await TVSPrinter.forceReinitialize();
          console.log('Reinitialization result:', reinitResult);
          ToastAndroid.show(`Reinit: ${reinitResult}`, ToastAndroid.LONG);
          
          // Check status again
          const newStatus = await TVSPrinter.checkPrinterStatus();
          console.log('New status after reinit:', newStatus);
          ToastAndroid.show(`New status: ${newStatus}`, ToastAndroid.SHORT);
          
          if (newStatus === 'Ready') {
            // Test print
            const testReceipt = 'TEST PRINT\\n================================\\nTVS SDK Integration Test\\nDate: ' + new Date().toLocaleString() + '\\n================================\\nTest Successful';
            
            const result = await TVSPrinter.printTicket(testReceipt);
            console.log('Test print result:', result);
            ToastAndroid.show(`Test print: ${result}`, ToastAndroid.LONG);
            
            return true;
          } else {
            ToastAndroid.show(`Printer still not ready: ${newStatus}`, ToastAndroid.LONG);
            return false;
          }
          
        } catch (reinitError) {
          console.error('Reinitialization failed:', reinitError);
          ToastAndroid.show(`Reinit failed: ${reinitError.message}`, ToastAndroid.LONG);
          return false;
        }
        
      } else if (status === 'Ready') {
        // Test print directly
        const testReceipt = 'TEST PRINT\\n================================\\nTVS SDK Integration Test\\nDate: ' + new Date().toLocaleString() + '\\n================================\\nTest Successful';
        
        const result = await TVSPrinter.printTicket(testReceipt);
        console.log('Test print result:', result);
        ToastAndroid.show(`Test print: ${result}`, ToastAndroid.LONG);
        
        return true;
      } else {
        ToastAndroid.show(`Printer not ready: ${status}`, ToastAndroid.LONG);
        return false;
      }
      
    } catch (error) {
      console.error('Test failed:', error);
      ToastAndroid.show(`Test failed: ${error.message}`, ToastAndroid.LONG);
      return false;
    }
    
  } catch (error) {
    console.error('TVS Test error:', error);
    ToastAndroid.show(`TVS Test error: ${error.message}`, ToastAndroid.LONG);
    return false;
  }
};

export const printSampleTicket = async () => {
  const sampleTicket = {
    event_name: 'Sample Festival',
    sub_event_name: 'Main Stage',
    entry_type_name: 'VIP Entry',
    ticket_id: 'TEST-' + Date.now(),
    price: '500'
  };
  
  const { printTicket } = require('./printerService');
  return await printTicket(sampleTicket);
};

export const testPrinterInitialization = async () => {
  try {
    console.log('=== TESTING PRINTER INITIALIZATION ===');
    ToastAndroid.show('🔍 Testing printer initialization...', ToastAndroid.SHORT);
    
    if (!TVSPrinter) {
      ToastAndroid.show('❌ TVSPrinter module not available', ToastAndroid.LONG);
      return false;
    }
    
    // Check device service availability first
    try {
      const serviceCheck = await TVSPrinter.checkDeviceService();
      console.log('Device service check:', serviceCheck);
      ToastAndroid.show(`Service check: ${serviceCheck}`, ToastAndroid.LONG);
      
      if (!serviceCheck.includes('All device services available')) {
        ToastAndroid.show('⚠️ Device services not ready', ToastAndroid.LONG);
        return false;
      }
    } catch (serviceError) {
      console.error('Service check failed:', serviceError);
      ToastAndroid.show(`Service check failed: ${serviceError.message}`, ToastAndroid.LONG);
      return false;
    }
    
    // Force reinitialization
    const reinitResult = await TVSPrinter.forceReinitialize();
    console.log('Force reinit result:', reinitResult);
    ToastAndroid.show(`Force reinit: ${reinitResult}`, ToastAndroid.LONG);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check final status
    const finalStatus = await TVSPrinter.checkPrinterStatus();
    console.log('Final status:', finalStatus);
    ToastAndroid.show(`Final status: ${finalStatus}`, ToastAndroid.LONG);
    
    return finalStatus === 'Ready';
    
  } catch (error) {
    console.error('Initialization test failed:', error);
    ToastAndroid.show(`Init test failed: ${error.message}`, ToastAndroid.LONG);
    return false;
  }
};

export const checkDeviceServices = async () => {
  try {
    if (!TVSPrinter) {
      ToastAndroid.show('❌ TVSPrinter module not available', ToastAndroid.LONG);
      return false;
    }
    
    const result = await TVSPrinter.checkDeviceService();
    console.log('Device services:', result);
    ToastAndroid.show(`Device services: ${result}`, ToastAndroid.LONG);
    
    return result.includes('All device services available');
    
  } catch (error) {
    console.error('Device service check failed:', error);
    ToastAndroid.show(`Service check error: ${error.message}`, ToastAndroid.LONG);
    return false;
  }
};