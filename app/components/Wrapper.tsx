import Navbar from "./Navbar";

type WrapperProps = {
  children: React.ReactNode;
};

const Wrapper = ({ children }: WrapperProps) => {
  return (
    <div>
      <Navbar />
      <div className="mb-10 mt-8 px-5 md:px-[10%]">{children}</div>
    </div>
  );
};

export default Wrapper;
