import { NativeModules, ToastAndroid } from 'react-native';

export const printTicket = async (ticketData) => {
  try {
    console.log('=== SMART POS PRINTER START ===');
    console.log('Ticket data:', ticketData.ticket_id);
    ToastAndroid.show('🖨️ Starting print process...', ToastAndroid.LONG);
    
    const receipt = `DREAMS ENTERTAINMENT\n================================\nEVENT: ${ticketData.event_name}\nSUB-EVENT: ${ticketData.sub_event_name}\nENTRY TYPE: ${ticketData.entry_type_name}\n--------------------------------\nTICKET ID: ${ticketData.ticket_id}\nPRICE: Rs.${ticketData.price}\nDATE: ${new Date().toLocaleDateString()}\nTIME: ${new Date().toLocaleTimeString()}\n--------------------------------\nSCAN QR FOR VERIFICATION\n${ticketData.ticket_id}\n================================\nTHANK YOU\n\n`;
    
    console.log('Receipt prepared, length:', receipt.length);
    ToastAndroid.show(`📄 Receipt prepared (${receipt.length} chars)`, ToastAndroid.SHORT);
    
    // Debug: Check all available modules
    console.log('=== CHECKING NATIVE MODULES ===');
    const moduleKeys = Object.keys(NativeModules);
    console.log('Total modules found:', moduleKeys.length);
    console.log('All modules:', moduleKeys);
    ToastAndroid.show(`📱 Found ${moduleKeys.length} native modules`, ToastAndroid.SHORT);
    
    // Check specifically for SmartPOSPrinter
    const { SmartPOSPrinter } = NativeModules;
    console.log('SmartPOSPrinter module:', SmartPOSPrinter);
    console.log('SmartPOSPrinter type:', typeof SmartPOSPrinter);
    
    if (SmartPOSPrinter) {
      console.log('✅ SmartPOSPrinter module FOUND');
      console.log('Available methods:', Object.keys(SmartPOSPrinter));
      ToastAndroid.show('✅ SmartPOSPrinter module found!', ToastAndroid.LONG);
      ToastAndroid.show(`Methods: ${Object.keys(SmartPOSPrinter).join(', ')}`, ToastAndroid.LONG);
      
      console.log('=== CALLING PRINT METHOD ===');
      ToastAndroid.show('🖨️ Calling printText method...', ToastAndroid.SHORT);
      
      try {
        const result = await SmartPOSPrinter.printText(receipt);
        console.log('✅ Print method returned:', result);
        console.log('Print result type:', typeof result);
        ToastAndroid.show(`✅ Print result: ${result}`, ToastAndroid.LONG);
        return true;
      } catch (printError) {
        console.error('❌ Print method failed:', printError);
        console.error('Print error code:', printError.code);
        console.error('Print error message:', printError.message);
        ToastAndroid.show(`❌ Print failed: ${printError.message}`, ToastAndroid.LONG);
        ToastAndroid.show(`Error code: ${printError.code || 'Unknown'}`, ToastAndroid.SHORT);
        return false;
      }
    } else {
      console.log('❌ SmartPOSPrinter module NOT FOUND');
      console.log('This means module registration failed');
      ToastAndroid.show('❌ SmartPOSPrinter module missing!', ToastAndroid.LONG);
      ToastAndroid.show('Module registration failed in build', ToastAndroid.LONG);
      
      // Show what modules ARE available
      if (moduleKeys.length > 0) {
        ToastAndroid.show(`Available: ${moduleKeys.slice(0,3).join(', ')}...`, ToastAndroid.LONG);
      } else {
        ToastAndroid.show('No native modules loaded at all!', ToastAndroid.LONG);
      }
      return false;
    }
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
    console.error('Error stack:', error.stack);
    ToastAndroid.show(`❌ Critical error: ${error.message}`, ToastAndroid.LONG);
    return false;
  }
};

export const checkPrinterStatus = async () => {
  try {
    const { SmartPOSPrinter } = NativeModules;
    if (SmartPOSPrinter) {
      // Test printer connection
      const result = await SmartPOSPrinter.printText("TEST PRINT\n\n");
      console.log('Printer test result:', result);
      ToastAndroid.show(`Printer test: ${result}`, ToastAndroid.SHORT);
      return { status: 'ready', result };
    }
    return { status: 'not_found' };
  } catch (error) {
    console.log('Printer status error:', error.message);
    ToastAndroid.show(`Printer error: ${error.message}`, ToastAndroid.SHORT);
    return { status: 'error', error: error.message };
  }
};