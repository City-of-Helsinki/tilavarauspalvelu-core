export default function LogoutPage() {
  return null;
}

// eslint-disable-next-line require-await
export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };
}
