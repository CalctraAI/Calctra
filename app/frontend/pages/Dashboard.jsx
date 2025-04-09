import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Layout, Typography, Row, Col, Card, Statistic, Button, Tabs, Alert, Space, Divider } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  DesktopOutlined, 
  DollarOutlined, 
  ClockCircleOutlined, 
  RocketOutlined,
  AreaChartOutlined,
  CloudOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';

import ResourceList from '../components/ResourceList';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const Dashboard = () => {
  const { publicKey, connected } = useWallet();
  const [userStats, setUserStats] = useState({
    balance: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalSpent: 0,
  });
  
  const [computationTime, setComputationTime] = useState([]);
  const [resourceUsage, setResourceUsage] = useState([]);
  
  useEffect(() => {
    if (connected) {
      // In a real app, this would fetch data from the blockchain
      fetchUserStats();
      fetchComputationTimeData();
      fetchResourceUsageData();
    }
  }, [connected, publicKey]);
  
  const fetchUserStats = () => {
    // Mock data for demo purposes
    setUserStats({
      balance: 2500.75,
      activeJobs: 3,
      completedJobs: 27,
      totalSpent: 1248.50,
    });
  };
  
  const fetchComputationTimeData = () => {
    // Mock data for time series chart
    const mockData = [
      { name: 'Jan', hours: 24 },
      { name: 'Feb', hours: 35 },
      { name: 'Mar', hours: 42 },
      { name: 'Apr', hours: 58 },
      { name: 'May', hours: 47 },
      { name: 'Jun', hours: 63 },
      { name: 'Jul', hours: 78 },
    ];
    setComputationTime(mockData);
  };
  
  const fetchResourceUsageData = () => {
    // Mock data for resource type distribution
    const mockData = [
      { name: 'CPU', value: 45 },
      { name: 'GPU', value: 35 },
      { name: 'Storage', value: 20 },
    ];
    setResourceUsage(mockData);
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
  
  const renderActiveComputations = () => {
    if (userStats.activeJobs === 0) {
      return (
        <Alert
          message="No Active Computations"
          description="You don't have any active computation jobs. Start a new computation to see it here."
          type="info"
          showIcon
          action={
            <Button size="small" type="primary">
              Start New Computation
            </Button>
          }
        />
      );
    }
    
    return (
      <div className="active-computations">
        {Array.from({ length: userStats.activeJobs }).map((_, index) => (
          <Card key={index} size="small" className="active-job-card" style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col span={16}>
                <Title level={5}>Matrix Decomposition {index + 1}</Title>
                <Paragraph>Running on Provider {index + 5}</Paragraph>
                <div className="job-details">
                  <span><DesktopOutlined /> 32 Cores</span>
                  <span><ClockCircleOutlined /> 3h 27m elapsed</span>
                  <span><DollarOutlined /> 17.5 CAL/hour</span>
                </div>
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <Space direction="vertical">
                  <Button type="primary" danger size="small">Stop</Button>
                  <Button size="small">View Details</Button>
                </Space>
              </Col>
            </Row>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header">
        <Title level={2} style={{ color: 'white', margin: 0 }}>Calctra Dashboard</Title>
      </Header>
      <Content className="dashboard-content">
        {!connected ? (
          <Alert
            message="Wallet Not Connected"
            description="Please connect your Solana wallet to access the dashboard."
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        ) : (
          <>
            <Row gutter={24} className="stats-row">
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="CAL Balance"
                    value={userStats.balance}
                    precision={2}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<DollarOutlined />}
                    suffix="CAL"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Active Jobs"
                    value={userStats.activeJobs}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<RocketOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Completed Jobs"
                    value={userStats.completedJobs}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Total Spent"
                    value={userStats.totalSpent}
                    precision={2}
                    valueStyle={{ color: '#cf1322' }}
                    prefix={<DollarOutlined />}
                    suffix="CAL"
                  />
                </Card>
              </Col>
            </Row>
            
            <Tabs defaultActiveKey="1" className="dashboard-tabs">
              <TabPane
                tab={<span><DesktopOutlined /> Resources</span>}
                key="1"
              >
                <ResourceList />
              </TabPane>
              <TabPane
                tab={<span><RocketOutlined /> Active Computations</span>}
                key="2"
              >
                {renderActiveComputations()}
              </TabPane>
              <TabPane
                tab={<span><AreaChartOutlined /> Analytics</span>}
                key="3"
              >
                <Row gutter={24}>
                  <Col xs={24} lg={14}>
                    <Card title="Computation Time History">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={computationTime}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="hours" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col xs={24} lg={10}>
                    <Card title="Resource Usage Distribution">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={resourceUsage}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {resourceUsage.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </>
        )}
      </Content>
    </Layout>
  );
};

export default Dashboard; 