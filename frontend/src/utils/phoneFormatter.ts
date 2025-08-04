export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters except the initial +
  const cleaned = value.replace(/[^\d+]/g, '').replace(/\+/g, (match, offset) => offset === 0 ? match : '');
  
  // Keep the + at the beginning if it exists
  const hasPlus = cleaned.startsWith('+');
  const digits = hasPlus ? cleaned.slice(1) : cleaned;
  
  // Format based on country code
  let formatted = '';
  
  // US/Canada format: +1 (XXX) XXX-XXXX
  if (digits.startsWith('1') && digits.length <= 11) {
    if (digits.length > 1) {
      formatted = '1 ';
      const areaCode = digits.slice(1, 4);
      const middle = digits.slice(4, 7);
      const last = digits.slice(7, 11);
      
      if (areaCode) {
        formatted += `(${areaCode}`;
        if (areaCode.length === 3) formatted += ')';
      }
      if (middle) {
        formatted += ` ${middle}`;
        if (middle.length === 3 && last) formatted += '-';
      }
      if (last) formatted += last;
    } else {
      formatted = digits;
    }
  }
  // Mexico format: +52 XXX XXX XXXX or +52 1 XXX XXX XXXX (mobile)
  else if (digits.startsWith('52') && digits.length >= 12) {
    formatted = '52 ';
    let remaining = digits.slice(2);
    
    // Check if it's a mobile number (has a 1 after country code)
    if (remaining.startsWith('1') && remaining.length === 11) {
      formatted += '1 ';
      remaining = remaining.slice(1);
    }
    
    // Format as XXX XXX XXXX
    if (remaining.length >= 10) {
      formatted += remaining.slice(0, 3) + ' ';
      formatted += remaining.slice(3, 6) + ' ';
      formatted += remaining.slice(6, 10);
      formatted += remaining.slice(10); // Any extra digits
    } else {
      formatted += remaining;
    }
  }
  // Brazil format: +55 XX XXXXX-XXXX
  else if (digits.startsWith('55') && digits.length >= 12) {
    formatted = '55 ';
    const areaCode = digits.slice(2, 4);
    const firstPart = digits.slice(4, 9);
    const secondPart = digits.slice(9, 13);
    
    if (areaCode) formatted += areaCode + ' ';
    if (firstPart) formatted += firstPart;
    if (secondPart) formatted += '-' + secondPart;
    formatted += digits.slice(13); // Any extra digits
  }
  // UK format: +44 XXXX XXXXXX
  else if (digits.startsWith('44') && digits.length >= 12) {
    formatted = '44 ';
    formatted += digits.slice(2, 6) + ' ';
    formatted += digits.slice(6);
  }
  // Generic international format
  else if (digits.length > 0) {
    // Try to identify country code (1-3 digits)
    let countryCodeLength = 1;
    
    // Common 2-digit country codes
    const twoDigitCodes = ['20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49', '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', '92', '93', '94', '95', '98'];
    
    // Common 3-digit country codes
    const threeDigitCodes = ['212', '213', '216', '218', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '290', '291', '297', '298', '299', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '370', '371', '372', '373', '374', '375', '376', '377', '378', '380', '381', '382', '383', '385', '386', '387', '389', '420', '421', '423', '500', '501', '502', '503', '504', '505', '506', '507', '508', '509', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '670', '672', '673', '674', '675', '676', '677', '678', '679', '680', '681', '682', '683', '684', '685', '686', '687', '688', '689', '690', '691', '692', '850', '852', '853', '855', '856', '880', '886', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '992', '993', '994', '995', '996', '998'];
    
    if (threeDigitCodes.includes(digits.slice(0, 3)) && digits.length > 3) {
      countryCodeLength = 3;
    } else if (twoDigitCodes.includes(digits.slice(0, 2)) && digits.length > 2) {
      countryCodeLength = 2;
    }
    
    formatted = digits.slice(0, countryCodeLength) + ' ';
    let remaining = digits.slice(countryCodeLength);
    
    // Format the rest in groups of 3-4
    while (remaining.length > 0) {
      const groupSize = remaining.length > 7 ? 3 : remaining.length > 4 ? 4 : remaining.length;
      formatted += remaining.slice(0, groupSize);
      remaining = remaining.slice(groupSize);
      if (remaining.length > 0) formatted += ' ';
    }
  } else {
    formatted = digits;
  }
  
  return hasPlus ? '+' + formatted : formatted;
};

export const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Must start with + or digit
  if (!cleaned.match(/^[+\d]/)) return false;
  
  // If starts with +, must have country code
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    // Minimum 10 digits for most countries
    return digits.length >= 10 && digits.length <= 15 && /^\d+$/.test(digits);
  }
  
  // Without +, assume it needs one
  return false;
};

export const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Ensure it starts with +
  if (!phone.startsWith('+') && digits.length > 0) {
    return '+' + digits;
  }
  
  return '+' + digits;
};