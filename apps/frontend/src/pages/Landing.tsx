import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  CheckCircle2, 
  Calendar, 
  ListTodo, 
  Target, 
  Brain, 
  Timer,
  ChartBar,
  FileText,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Languages
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export function Landing() {
  const { t, i18n } = useTranslation('landing')
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }
  
  const features = [
    {
      title: t('features.todos.title'),
      description: t('features.todos.description'),
      icon: ListTodo,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: t('features.calendar.title'),
      description: t('features.calendar.description'),
      icon: Calendar,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: t('features.goals.title'),
      description: t('features.goals.description'),
      icon: Target,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: t('features.notes.title'),
      description: t('features.notes.description'),
      icon: FileText,
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: t('features.pomodoro.title'),
      description: t('features.pomodoro.description'),
      icon: Timer,
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      title: t('features.analytics.title'),
      description: t('features.analytics.description'),
      icon: ChartBar,
      gradient: 'from-teal-500 to-cyan-500'
    }
  ]

  const benefits = [
    {
      icon: Zap,
      title: t('benefits.fast.title'),
      description: t('benefits.fast.description')
    },
    {
      icon: Shield,
      title: t('benefits.secure.title'),
      description: t('benefits.secure.description')
    },
    {
      icon: Globe,
      title: t('benefits.accessible.title'),
      description: t('benefits.accessible.description')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <Brain className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Personal Hub
              </span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              {/* Language Switcher */}
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-muted-foreground" />
                <select
                  value={i18n.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="bg-transparent border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
              <Link 
                to="/login" 
                className="px-4 py-2 text-foreground hover:text-primary transition-colors"
              >
                {t('navigation.signIn')}
              </Link>
              <Link 
                to="/register" 
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all transform hover:scale-105"
              >
                {t('navigation.getStarted')}
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-6">
              <div className="px-4 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>{t('hero.badge')}</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link 
                to="/register" 
                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {t('hero.cta.primary')}
              </Link>
              <Link 
                to="/login" 
                className="px-8 py-4 bg-muted text-foreground rounded-lg text-lg font-semibold hover:bg-muted/80 transition-all"
              >
                {t('hero.cta.secondary')}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-xl blur-xl"
                  style={{
                    background: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    '--tw-gradient-from': feature.gradient.split(' ')[1],
                    '--tw-gradient-to': feature.gradient.split(' ')[3]
                  } as React.CSSProperties}
                />
                <div className="relative bg-card p-8 rounded-xl border hover:border-primary/50 transition-all">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.gradient} p-2.5 mb-4`}>
                    <feature.icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div 
          className="container mx-auto text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-12 md:p-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <Link 
              to="/register" 
              className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span>{t('cta.button')}</span>
              <CheckCircle2 className="ml-2 w-5 h-5" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('cta.disclaimer')}
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="w-5 h-5" />
              <span>{t('footer.copyright')}</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/terms" className="hover:text-foreground transition-colors">
                {t('footer.terms')}
              </Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                {t('footer.privacy')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}