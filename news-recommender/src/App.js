import logo from './logo.svg';
import './App.css';

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from './components/HomePage.tsx';
import TrendingNewsPage from './components/Trending.tsx';
import Login from './views/login/Login';
import Register from './views/register/Register';
import { AuthProvider } from './contexts/AuthContext.tsx';
import NewsDetail from './components/NewsDetail.tsx';
import Settings from './views/user/settings.tsx';
import './utils/axiosConfig';  // 导入拦截器配置


function App() {
  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      {/* BrowserRouter 外部的组件无法访问认证状态
      认证功能通常需要与路由紧密集成（如登录后重定向、保护路由等）
      这种方式允许 AuthProvider 内部使用 useNavigate 或 useLocation 等路由 hooks
      如果放在BroserRouter外面,AuthProvider 不能使用路由相关功能（如 useNavigate、useLocation 等） Context 只能被子组件访问，父组件无法访问子组件创建的 Context*/}
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/*" element={<HomePage />} />
            {/* <Route path="/trending" element={<TrendingNewsPage />} /> */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/category/:category" element={<HomePage />} />
            <Route path="/category/:category/:subcategory" element={<HomePage />} />
            <Route path="/news/:newsId" element={<NewsDetail />} />
            <Route path="/settings" element={<Settings />} />
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

// // 创建一个包装组件，在HomePage中显示Trending内容
// const TrendingNewsInHomePage = () => {
//   return <Navigate to="/?page=trending" replace />;
// };

export default App;
