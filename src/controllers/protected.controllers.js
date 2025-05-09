export const someProtectedRoute = (req, res) => {
    res.status(200).json({ message: "Welcome to a protected route", user: req.user, success: true });
  };