
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./App.css";

const API = "http://localhost:8080";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="logo">BookMyShow</Link>
      <div>
        <Link to="/">Movies</Link>
        <Link to="/bookings">My Bookings</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </nav>
  );
}

function Movies() {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/movies`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed");
        return response.json();
      })
      .then((data) => setMovies(Array.isArray(data) ? data : []))
      .catch(() => setError("Cannot load movies. Check the backend."));
  }, []);

  function getPoster(movie) {
    const title = (movie.title || "").toLowerCase();

    if (title.includes("varanasi")) return "/varanasi.jpg";
    if (title.includes("avengers")) return "/avengers.jpg";

    return "";
  }

  return (
    <div className="container">
      <h1>Now Showing</h1>
      {error && <p>{error}</p>}

      <div className="movie-grid">
        {movies.map((movie) => (
          <div className="movie-card" key={movie.id}>
            {getPoster(movie) ? (
              <img
                src={getPoster(movie)}
                alt={movie.title}
                style={{
                  width: "100%",
                  height: "350px",
                  objectFit: "cover",
                  display: "block",
                  borderRadius: "10px",
                }}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="poster-fallback">🎬</div>
            )}

            <h2>{movie.title}</h2>
            <p>{movie.genre || "Genre not available"}</p>
            <p>{movie.language || "Language not available"}</p>
            <p>Duration: {movie.duration} minutes</p>
            <p>Rating: {movie.rating || "Not rated"}</p>
            <p>{movie.description}</p>

            <Link className="button" to={`/movie/${movie.id}`}>
              Book Tickets
            </Link>
          </div>
        ))}
      </div>

      {movies.length === 0 && !error && <p>Loading movies...</p>}
    </div>
  );
}

function MovieDetails() {
  const { id } = useParams();
  const [shows, setShows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/shows`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed");
        return response.json();
      })
      .then((data) => {
        const allShows = Array.isArray(data) ? data : [];
        setShows(
          allShows.filter(
            (show) =>
              String(show.movie?.id ?? show.movieId ?? "") === String(id)
          )
        );
      })
      .catch(() => setError("Could not load shows."));
  }, [id]);

  return (
    <div className="container">
      <h1>Select a Show</h1>
      {error && <p>{error}</p>}

      {shows.map((show) => (
        <div className="movie-card" key={show.id}>
          <p>Date: {show.showDate || show.date || "Not available"}</p>
          <p>Time: {show.showTime || show.time || "Not available"}</p>
          <p>Price: ₹{show.price || 300}</p>
          <Link className="button" to={`/seats/${show.id}`}>
            Select Seats
          </Link>
        </div>
      ))}

      {shows.length === 0 && !error && <p>No shows available for this movie.</p>}
    </div>
  );
}

function Seats() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");

  const seats = ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4"];

  function toggleSeat(seat) {
    setSelected((previous) =>
      previous.includes(seat)
        ? previous.filter((item) => item !== seat)
        : [...previous, seat]
    );
  }

  async function bookTickets() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      navigate("/login");
      return;
    }

    if (selected.length === 0) {
      setMessage("Please select at least one seat.");
      return;
    }

    try {
      const response = await fetch(
        `${API}/bookings/user/${userId}/show/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seats: selected.join(",") }),
        }
      );

      if (!response.ok) {
        setMessage("Booking failed. Please check the backend.");
        return;
      }

      alert("Tickets booked successfully!");
      navigate("/bookings");
    } catch {
      setMessage("Cannot connect to the backend.");
    }
  }

  return (
    <div className="container">
      <h1>Select Your Seats</h1>
      <div className="seat-grid">
        {seats.map((seat) => (
          <button
            key={seat}
            type="button"
            className={selected.includes(seat) ? "seat selected" : "seat"}
            onClick={() => toggleSeat(seat)}
          >
            {seat}
          </button>
        ))}
      </div>

      <p>Selected seats: {selected.join(", ") || "None"}</p>
      <h3>Total: ₹{selected.length * 300}</h3>
      {message && <p>{message}</p>}

      <button className="button" onClick={bookTickets}>
        Confirm Booking
      </button>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    try {
      const response = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setMessage("Login failed. Check your email and password.");
        return;
      }

      const user = await response.json();
      localStorage.setItem("userId", user.id);
      navigate("/");
    } catch {
      setMessage("Cannot connect to the backend.");
    }
  }

  return (
    <div className="container">
      <h1>Login</h1>
      <form onSubmit={handleLogin} className="form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button className="button" type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(event) {
    event.preventDefault();

    try {
      const response = await fetch(`${API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        setMessage("Registration failed. Please try again.");
        return;
      }

      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch {
      setMessage("Cannot connect to the backend.");
    }
  }

  return (
    <div className="container">
      <h1>Create Account</h1>
      <form onSubmit={handleRegister} className="form">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button className="button" type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setMessage("Please log in to see your bookings.");
      return;
    }

    fetch(`${API}/bookings/user/${userId}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed");
        return response.json();
      })
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setMessage("Could not load bookings."));
  }, []);

  return (
    <div className="container">
      <h1>My Bookings</h1>
      {message && <p>{message}</p>}

      {bookings.map((booking) => (
        <div className="movie-card" key={booking.id}>
          <p>Booking ID: {booking.id}</p>
          <p>Seats: {booking.seats || "Not available"}</p>
          <p>
            Total Amount: ₹
            {booking.totalAmount ?? booking.totalPrice ?? "Not available"}
          </p>
          <p>Status: {booking.status || "Confirmed"}</p>
        </div>
      ))}

      {bookings.length === 0 && !message && <p>No bookings found.</p>}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Movies />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/seats/:id" element={<Seats />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/bookings" element={<Bookings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
