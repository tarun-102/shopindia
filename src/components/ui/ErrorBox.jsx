const ErrorBox = ({ message }) => {
  return (
    <div className="text-center text-red-400 py-10">
      {message}
    </div>
  );
};

export default ErrorBox;
