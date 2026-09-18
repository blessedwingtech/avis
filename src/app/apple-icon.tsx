import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Dimensions pour Apple Touch Icon
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #006039 0%, #00331e 100%)',
          borderRadius: 38,
          border: '4px solid rgba(245, 158, 11, 0.6)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="#f39c12"
          stroke="#f59e0b"
          strokeWidth="1"
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
          }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
