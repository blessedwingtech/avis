import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Dimensions de l'icône de l'onglet
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: 7,
          border: '1.5px solid rgba(245, 158, 11, 0.6)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="#f39c12"
          stroke="#f59e0b"
          strokeWidth="1"
          style={{
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
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
