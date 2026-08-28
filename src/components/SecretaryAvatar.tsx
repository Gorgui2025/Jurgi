export default function SecretaryAvatar({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Siny, secrétariat Jurgi"
    >
      <circle cx="32" cy="32" r="32" fill="#F6F0E5" />
      <circle cx="32" cy="32" r="30" fill="#E8F1EC" />
      <circle cx="32" cy="26" r="12" fill="#1F6B4F" />
      <path d="M20 56c0-7 5-12 12-12s12 5 12 12V58H20v-2z" fill="#1F6B4F" />
      <circle cx="27.5" cy="25" r="1.9" fill="#F6F0E5" />
      <circle cx="36.5" cy="25" r="1.9" fill="#F6F0E5" />
      <path d="M28.5 31c2.3 2.1 4.7 2.1 7 0" stroke="#C8893D" strokeWidth="1.7" strokeLinecap="round" fill="none" />
    </svg>
  );
}
