import Link from "next/link";

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">概览</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-700 mb-2">广告位数量</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <Link href="/zones" className="text-sm text-blue-600 mt-2 inline-block">查看详情</Link>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-700 mb-2">广告数量</h3>
          <p className="text-3xl font-bold text-green-600">0</p>
          <Link href="/ads" className="text-sm text-blue-600 mt-2 inline-block">查看详情</Link>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-700 mb-2">今日展示</h3>
          <p className="text-3xl font-bold text-purple-600">0</p>
          <Link href="/stats" className="text-sm text-blue-600 mt-2 inline-block">查看详情</Link>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-700 mb-2">今日点击</h3>
          <p className="text-3xl font-bold text-orange-600">0</p>
          <Link href="/stats" className="text-sm text-blue-600 mt-2 inline-block">查看详情</Link>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-700 mb-4">最近活动</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div>
                <p className="text-sm font-medium">系统初始化完成</p>
                <p className="text-xs text-gray-500">刚刚</p>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">成功</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-700 mb-4">快速操作</h3>
          <div className="space-y-2">
            <Link href="/zones/create" className="block p-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
              创建广告位
            </Link>
            <Link href="/products/create" className="block p-3 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors">
              注册产品
            </Link>
            <Link href="/ads/create" className="block p-3 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors">
              创建广告
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
