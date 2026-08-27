import React from 'react';
import { Card, Form, Input, Button, Row, Col, Typography } from 'antd';
import { UserOutlined, LockOutlined, ExperimentOutlined, InfoCircleOutlined, } from '@ant-design/icons';
import './App.css';

const { Title, Paragraph, Text } = Typography;

export default function App() {
  const handleGestorSubmit = (values: any) => ('infobanco');
  const handleTecnicoSubmit = (values: any) => ('infobanco');
  const handlePesquisadorSubmit = (values: any) => ('infobanco');

  return (
    <div className="loginContainer">
      <div className="leftPanel">
        <div className="mainContent">
          <div className="headerSection">
            <Title level={2} className="headerTitle"><ExperimentOutlined className="headerIcon" /> Nidus</Title>
            <Text className="headerSubtitle">Sistema de Gestão de Biotério — CPMR / UFSC</Text>
          </div>

          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12}>
              <Card title="Acesso Gestor" size="small" className="loginCard">
                <Form layout="vertical" onFinish={handleGestorSubmit}>
                  <Form.Item name="user" label="Usuário" rules={[{ required: true, message: 'Digite o usuário' }]}> 
                    <Input prefix={<UserOutlined />} placeholder="Usuário" />
                  </Form.Item>
                  <Form.Item name="pass" label="Senha" rules={[{ required: true, message: 'Digite a senha' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Senha" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block className="btnSubmit">Entrar</Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} sm={12}>
              <Card title="Acesso Técnico" size="small" className="loginCard">
                <Form layout="vertical" onFinish={handleTecnicoSubmit}>
                  <Form.Item name="user" label="Usuário" rules={[{ required: true, message: 'Digite o usuário' }]}>
                    <Input prefix={<UserOutlined />} placeholder="Usuário" />
                  </Form.Item>
                  <Form.Item name="pass" label="Senha" rules={[{ required: true, message: 'Digite a senha' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Senha" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block className="btnSubmit">Entrar</Button>
                </Form>
              </Card>
            </Col>
          </Row>

          <Row gutter={[20, 20]} className="secondRow">
            <Col xs={24} sm={12}>
              <Card title="Acesso Pesquisador" size="small" className="loginCard">
                <Form layout="vertical" onFinish={handlePesquisadorSubmit}>
                  <Form.Item name="user" label="Usuário" rules={[{ required: true, message: 'Digite o usuário' }]}>
                    <Input prefix={<UserOutlined />} placeholder="Usuário" />
                  </Form.Item>
                  <Form.Item name="pass" label="Senha" rules={[{ required: true, message: 'Digite a senha' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Senha" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block className="btnSubmit">Entrar</Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} sm={12}>
              <div className="infoBox">
                <div>
                  <div className="infoBoxHeader">
                    <InfoCircleOutlined className="infoIcon" /> <Text className="infoTitle">Biotério Central UFSC</Text>
                  </div>
                  <Text className="infoText">
                    Unidade dedicada à criação, controle e suporte na manutenção de roedores para atividades de pesquisa e ensino da universidade.
                  </Text>
                </div>
                <div className="infoFooter">
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <div className="bottomWhiteBar">
          <div className="bottomBarContent">
            <Title level={4} className="bottomBarTitle">Centro de Pesquisas Biológicas</Title>
            <Paragraph className="bottomBarText">
              Plataforma restrita para controle de matrizes, linhagens e alocação de roedores. Para dúvidas operacionais ou cadastro de pesquisadores, entre em contato com a administração do CPMR / UFSC.
            </Paragraph>
          </div>
        </div>
      </div>

      <div className="sideImage" />
    </div>
  );
}