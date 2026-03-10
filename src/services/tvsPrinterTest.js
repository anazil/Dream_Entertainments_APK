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
      
      if (status === 'Ready') {
        // Test print
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