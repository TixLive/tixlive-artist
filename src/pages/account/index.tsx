import type { GetServerSideProps } from 'next';

// Cabinet root — always redirect to the orders tab.
export default function AccountIndexPage() {
	return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
	return { redirect: { destination: '/account/orders', permanent: false } };
};
