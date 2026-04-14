import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-white">
          <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold">MuiAD</h1>
                  <p className="ml-4 text-sm opacity-90">MCP-first、Self-hosted、AI 驱动的去中心化开发者推广网络</p>
                </div>
                <div className="flex items-center space-x-4">
                  <a href="#features" className="text-sm hover:underline">功能</a>
                  <a href="#docs" className="text-sm hover:underline">文档</a>
                  <a href="#deploy" className="text-sm hover:underline">部署</a>
                  <a href="/admin" className="px-4 py-2 bg-white text-blue-600 rounded-md font-medium hover:bg-opacity-90 transition-colors">管理面板</a>
                </div>
              </div>
            </div>
          </header>
          <main>
            {children}
          </main>
          <footer className="bg-gray-100 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-bold mb-4">MuiAD</h3>
                  <p className="text-sm text-gray-600">让开发者在写代码的时候，顺便就让 AI 把推广的事办了。</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-4">链接</h3>
                  <ul className="space-y-2 text-sm">
                    <li><a href="#" className="text-gray-600 hover:text-blue-600">GitHub</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-blue-600">文档</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-blue-600">社区</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-4">联系我们</h3>
                  <p className="text-sm text-gray-600">hello@muiad.dev</p>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
                © 2026 MuiAD. 保留所有权利。
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
