import { NativeModules, ToastAndroid } from 'react-native';

const { TVSPrinter } = NativeModules;

export const printTicket = async (ticketData) => {
  try {
    console.log('=== TVS PRINTER START ===');
    console.log('Ticket data:', ticketData.ticket_id);
    ToastAndroid.show('🖨️ Starting TVS print process...', ToastAndroid.LONG);
    
    const receipt = `EVENT: ${ticketData.event_name}\nSUB-EVENT: ${ticketData.sub_event_name}\nENTRY TYPE: ${ticketData.entry_type_name}\n--------------------------------\nTICKET ID: ${ticketData.ticket_id}\nPRICE: Rs.${ticketData.price}\nDATE: ${new Date().toLocaleDateString()}\nTIME: ${new Date().toLocaleTimeString()}\n--------------------------------\nSCAN QR FOR VERIFICATION\n${ticketData.ticket_id}\n================================\nTHANK YOU`;
    
    console.log('Receipt prepared, length:', receipt.length);
    ToastAndroid.show(`📄 Receipt prepared (${receipt.length} chars)`, ToastAndroid.SHORT);
    
    if (TVSPrinter) {
      console.log('✅ TVSPrinter module FOUND');
      ToastAndroid.show('✅ TVSPrinter module found!', ToastAndroid.LONG);
      
      console.log('=== CALLING TVS PRINT METHOD ===');
      ToastAndroid.show('🖨️ Calling TVS printTicket method...', ToastAndroid.SHORT);
      
      try {
        const result = await TVSPrinter.printTicket(receipt);
        console.log('✅ TVS Print successful:', result);
        ToastAndroid.show(`✅ Print successful: ${result}`, ToastAndroid.LONG);
        
        // Also print QR code
        try {
          await TVSPrinter.printQRCode(ticketData.ticket_id);
          console.log('✅ QR Code printed');
          ToastAndroid.show('✅ QR Code printed', ToastAndroid.SHORT);
        } catch (qrError) {
          console.log('⚠️ QR Code print failed:', qrError.message);
          ToastAndroid.show(`⚠️ QR failed: ${qrError.message}`, ToastAndroid.SHORT);
        }
        
        return true;
      } catch (printError) {
        console.error('❌ TVS Print method failed:', printError);
        console.error('Print error code:', printError.code);
        console.error('Print error message:', printError.message);
        ToastAndroid.show(`❌ Print failed: ${printError.message}`, ToastAndroid.LONG);
        return false;
      }
    } else {
      console.log('❌ TVSPrinter module NOT FOUND');
      ToastAndroid.show('❌ TVSPrinter module missing!', ToastAndroid.LONG);
      return false;
    }
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
    ToastAndroid.show(`❌ Critical error: ${error.message}`, ToastAndroid.LONG);
    return false;
  }
};

export const checkPrinterStatus = async () => {
  try {
    if (TVSPrinter) {
      const result = await TVSPrinter.checkPrinterStatus();
      console.log('TVS Printer status:', result);
      ToastAndroid.show(`Printer status: ${result}`, ToastAndroid.SHORT);
      return { status: 'ready', result };
    }
    return { status: 'not_found' };
  } catch (error) {
    console.log('TVS Printer status error:', error.message);
    ToastAndroid.show(`Printer error: ${error.message}`, ToastAndroid.SHORT);
    return { status: 'error', error: error.message };
  }
};