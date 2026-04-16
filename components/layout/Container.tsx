export default function Container({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
            {children}
        </div>
    );
}
