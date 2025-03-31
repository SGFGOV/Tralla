import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  onComplete?: (value: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function OtpInput({
  length = 6,
  onComplete,
  value = '',
  onChange,
  disabled = false,
  className,
  inputClassName,
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(value.split('').slice(0, length).concat(Array(length).fill('').slice(value.length)));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Initialize refs array
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  useEffect(() => {
    // Update OTP state when value prop changes
    if (value) {
      const otpArray = value.split('').slice(0, length).concat(Array(length).fill('').slice(value.length));
      setOtp(otpArray);
    }
  }, [value, length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value;
    
    // Allow only single digit
    if (newValue.length > 1) return;
    
    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = newValue;
    setOtp(newOtp);
    
    // Notify parent component
    const otpValue = newOtp.join('');
    onChange?.(otpValue);
    
    // Focus next input if current input is filled
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Call onComplete callback if all inputs are filled
    if (newOtp.filter(Boolean).length === length) {
      onComplete?.(newOtp.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current input is empty, focus previous input
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Extract only digits from pasted content
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, length);
    const newOtp = [...Array(length).fill('')];
    
    digits.forEach((digit, index) => {
      newOtp[index] = digit;
    });
    
    setOtp(newOtp);
    onChange?.(newOtp.join(''));
    
    // Focus on the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(val => !val);
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
    
    // Call onComplete callback if all inputs are filled
    if (newOtp.filter(Boolean).length === length) {
      onComplete?.(newOtp.join(''));
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={otp[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={index === 0 ? handlePaste : undefined}
          disabled={disabled}
          className={cn(
            "w-10 h-12 text-center text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:bg-muted disabled:cursor-not-allowed",
            inputClassName
          )}
        />
      ))}
    </div>
  );
}